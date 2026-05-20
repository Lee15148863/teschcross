const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Store = require('../../models/saas/Store');
const StoreSignup = require('../../models/saas/StoreSignup');
const SaaSUser = require('../../models/saas/SaaSUser');
const { createTransporter } = require('../../utils/inv-crypto');
const { verifyActionCode, recordAudit } = require('../../utils/deployment-security');
const Deployment = require('../../models/saas/Deployment');
const { maskMongoUri, validateMongoUri } = require('../../utils/mongo-uri-validator');
const { getPlanDefaultModules, getPlanDatabasePolicy } = require('../../utils/storeflow-plans');

const JWT_SECRET = process.env.SAAS_JWT_SECRET;
const BCRYPT_SALT_ROUNDS = 10;

// Super admin auth middleware
function superAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      if (decoded.role === 'super_admin') { req.user = decoded; return next(); }
    } catch (e) { /* fall through */ }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/saas/stores — list all stores (super_admin only)
router.get('/', superAdminAuth, async (req, res) => {
  try {
    const stores = await Store.find({}).sort({ createdAt: -1 });
    res.json(stores);
  } catch (e) { res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/saas/stores/:id — single store detail (super_admin + store user)
router.get('/:id', storeOrSuperAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Auto-generate slug for existing stores (backfill)
    if (!store.slug && store.name) {
      store.slug = store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
      await store.save();
    }

    res.json(store.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/saas/stores/:id — update store SaaS config (super_admin only)
router.patch('/:id', superAdminAuth, async (req, res) => {
  try {
    const allowed = [
      'plan', 'subscriptionStatus', 'trialEndsAt', 'status',
      'ownerName', 'email', 'phone', 'notes',
      'timezone', 'currency', 'businessType', 'country',
      'storageLimitMB', 'backupPolicy', 'allowDataExport', 'dataRegion'
    ];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    // Map-type fields
    if (req.body.limits !== undefined && typeof req.body.limits === 'object') {
      updates.limits = new Map(Object.entries(req.body.limits));
    }
    if (req.body.featureOverrides !== undefined && typeof req.body.featureOverrides === 'object') {
      updates.featureOverrides = new Map(Object.entries(req.body.featureOverrides));
    }
    updates.updatedAt = new Date();

    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    res.json({ success: true, store });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/saas/stores/approve/:signupId — approve a store signup (super_admin)
router.post('/approve/:signupId', superAdminAuth, async (req, res) => {
  try {
    // Load signup — need mongoUri explicitly since select:false
    const signup = await StoreSignup.findById(req.params.signupId).select('+mongoUri +deploymentPinHash');
    if (!signup) return res.status(404).json({ error: 'Signup not found' });
    if (signup.status !== 'pending') return res.status(400).json({ error: 'Signup already processed' });

    // Build store data from signup
    const storeData = {
      name: signup.storeName, ownerName: signup.ownerName, email: signup.email,
      phone: signup.phone, country: signup.country, businessType: signup.businessType,
      notes: signup.notes, status: 'active', approvedBy: req.user.userId, approvedAt: new Date()
    };

    // If signup has mongoUri — production onboarding path
    if (signup.mongoUri) {
      // Validate timezone + currency are set
      if (!signup.timezone || !signup.currency) {
        return res.status(400).json({ error: 'Signup missing timezone/currency for production deployment' });
      }

      // Run full URI validation (connect + write/read/delete)
      const valResult = await validateMongoUri(signup.mongoUri, {
        mainPosDbName: process.env.STORE_NAME || 'techcross',
        adminDbName: process.env.SAAS_DB_NAME || 'saas_admin',
        timeoutMs: 5000
      });

      if (!valResult.ok) {
        // Block deployment with safe error
        return res.status(400).json({
          error: 'MongoDB URI validation failed: ' + (valResult.message || 'URI is not valid'),
          code: valResult.code,
          maskedUri: valResult.maskedUri,
          dbName: valResult.dbName || null
        });
      }

      // Validation passed — proceed with store + user + deployment creation
      if (signup.timezone) storeData.timezone = signup.timezone;
      if (signup.currency) storeData.currency = signup.currency;

      // Phase 1B: initialize plan + enabledModules from signup
      var planKey = signup.subscriptionPlan || 'free';
      storeData.plan = planKey;
      storeData.enabledModules = getPlanDefaultModules(planKey);
      storeData.disabledModules = [];
      storeData.subscriptionStatus = 'trialing';

      // Phase 3A: initialize database hosting defaults from plan
      var dbPolicy = getPlanDatabasePolicy(planKey);
      storeData.databaseMode = 'managed';
      storeData.storageLimitMB = dbPolicy.storageLimitMB;
      storeData.backupPolicy = dbPolicy.backupPolicy;
      storeData.allowDataExport = dbPolicy.allowDataExport;
      storeData.dataRegion = signup.preferredRegion || 'europe-west1';

      const store = await Store.create(storeData);

      // Generate managedDbName after store creation (needs _id for uniqueness)
      var storeSlug = store.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 32);
      var idSuffix = store._id.toString().slice(-6);
      store.managedDbName = 'storeflow_' + storeSlug + '_' + idSuffix;
      store.updatedAt = new Date();
      await store.save();

      // Create store_root user
      const finalUsername = signup.username || 'admin_' + store.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      let credentials;
      if (signup.password) {
        const rootUser = await SaaSUser.create({
          username: finalUsername, password: signup.password, displayName: signup.ownerName,
          email: signup.email, role: 'store_root', storeId: store._id, active: true
        });
        credentials = { username: rootUser.username, message: 'Use the password you set during registration to sign in.' };
      } else {
        const defaultPw = require('crypto').randomBytes(4).toString('hex') + 'X1!';
        const hashed = await bcrypt.hash(defaultPw, BCRYPT_SALT_ROUNDS);
        const rootUser = await SaaSUser.create({
          username: finalUsername, password: hashed, displayName: signup.ownerName,
          email: signup.email, role: 'store_root', storeId: store._id, active: true
        });
        credentials = { username: rootUser.username, password: defaultPw };
      }

      // T21c — store URI in Secret Manager for production path
      const sm = require('../../utils/gcp-secret-manager');
      let mongoUriStorageMode = 'plaintext_admin_db';
      let secretRef = null;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || '';

      try {
        secretRef = await sm.storeMongoUri(
          sm.buildSecretName(store.name),
          signup.mongoUri,
          projectId
        );
        if (secretRef && !secretRef.dryRun) {
          mongoUriStorageMode = 'secret_manager';
        }
      } catch (smErr) {
        console.warn('[stores] Secret Manager write failed, falling back to plaintext:', smErr.message);
      }

      // Create deployment for this store
      const serviceName = store.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '').slice(0, 63);
      const subdomain = serviceName;
      const maskedUri = maskMongoUri(signup.mongoUri);

      const depFields = {
        storeName: store.name,
        storeId: store._id,
        subdomain: subdomain,
        serviceName: serviceName || 'store-' + store._id,
        mongoUriStorageMode: mongoUriStorageMode,
        mongoUriMasked: maskedUri,
        mongoUriValidationStatus: 'passed',
        mongoUriLastValidatedAt: new Date(),
        mongoUriUpdatedAt: new Date(),
        pinHash: signup.deploymentPinHash || '',
        pinSetAt: signup.pinSetAt || new Date(),
        timezone: signup.timezone || 'Europe/Dublin',
        status: 'pending',
        atlasOwnershipConfirmed: signup.atlasOwnershipConfirmed || false,
        subscriptionStatus: 'trial',
      };

      if (mongoUriStorageMode === 'secret_manager' && secretRef) {
        depFields.mongoUriSecretName = secretRef.name;
        depFields.mongoUriSecretVersion = secretRef.version;
        depFields.secretLastUpdatedAt = new Date();
        depFields.mongoUri = '';
      } else {
        depFields.mongoUri = signup.mongoUri;
      }

      await Deployment.create(depFields);

      // Mark signup as approved
      signup.status = 'approved';
      signup.reviewedBy = req.user.userId;
      signup.reviewedAt = new Date();
      signup.mongoUriValidationStatus = 'passed';
      signup.mongoUriLastValidatedAt = new Date();
      await signup.save();

      return res.json({
        success: true,
        store: { id: store._id, name: store.name, slug: store.slug, timezone: signup.timezone, currency: signup.currency },
        deployment: { mongoUriMasked: maskedUri, storageMode: mongoUriStorageMode, status: 'pending', validationStatus: 'passed' },
        credentials
      });
    }

    // Legacy path — signup without mongoUri
    // Create store + owner user + deployment record without external MongoDB URI
    storeData.notes = (signup.notes || '') + ' [LEGACY: no MongoDB URI]';

    // Phase 1B: initialize plan + enabledModules from signup
    var planKey = signup.subscriptionPlan || 'free';
    storeData.plan = planKey;
    storeData.enabledModules = getPlanDefaultModules(planKey);
    storeData.disabledModules = [];
    storeData.subscriptionStatus = 'trialing';

    // Phase 3A: initialize database hosting defaults from plan
    var dbPolicy = getPlanDatabasePolicy(planKey);
    storeData.databaseMode = 'managed';
    storeData.storageLimitMB = dbPolicy.storageLimitMB;
    storeData.backupPolicy = dbPolicy.backupPolicy;
    storeData.allowDataExport = dbPolicy.allowDataExport;

    const store = await Store.create(storeData);

    // Generate managedDbName after store creation (needs _id for uniqueness)
    var storeSlug = store.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 32);
    var idSuffix = store._id.toString().slice(-6);
    store.managedDbName = 'storeflow_' + storeSlug + '_' + idSuffix;
    store.updatedAt = new Date();
    await store.save();

    // Create store_root user
    const finalUsername = signup.username || 'admin_' + store.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let credentials;
    if (signup.password) {
      const rootUser = await SaaSUser.create({
        username: finalUsername, password: signup.password, displayName: signup.ownerName,
        email: signup.email, role: 'store_root', storeId: store._id, active: true
      });
      credentials = { username: rootUser.username, message: 'Use the password you set during registration to sign in.' };
    } else {
      const defaultPw = require('crypto').randomBytes(4).toString('hex') + 'X1!';
      const hashed = await bcrypt.hash(defaultPw, BCRYPT_SALT_ROUNDS);
      const rootUser = await SaaSUser.create({
        username: finalUsername, password: hashed, displayName: signup.ownerName,
        email: signup.email, role: 'store_root', storeId: store._id, active: true
      });
      credentials = { username: rootUser.username, password: defaultPw };
    }

    // Create minimal deployment record (no mongoUri, no Cloud Run deploy)
    var serviceName = store.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '').slice(0, 63);
    try {
      await Deployment.create({
        storeName: store.name,
        storeId: store._id,
        serviceName: serviceName || 'store-' + store._id,
        mongoUriStorageMode: 'none',
        status: 'pending',
        timezone: signup.timezone || 'Europe/Dublin',
        subscriptionStatus: 'trial',
      });
    } catch (depErr) {
      console.error('[stores] Legacy deployment record creation failed:', depErr.message);
      // Non-fatal — store and user are created
    }

    // Mark signup as approved
    signup.status = 'approved';
    signup.reviewedBy = req.user.userId;
    signup.reviewedAt = new Date();
    await signup.save();

    res.json({ success: true, store: { id: store._id, name: store.name, slug: store.slug, legacy: true }, credentials });
  } catch (e) {
    console.error('[stores] approve signup error:', e.name || 'Error', e.message || e);
    if (e.code === 11000) {
      return res.status(400).json({ error: 'Duplicate key: ' + JSON.stringify(e.keyValue || {}) });
    }
    if (e.name === 'ValidationError') {
      var msgs = Object.values(e.errors||{}).map(function(x) { return x.message; });
      return res.status(400).json({ error: 'Validation: ' + msgs.join('; ') });
    }
    res.status(500).json({ error: e.message || 'Internal error' });
  }
});

// POST /api/saas/stores/reject/:signupId — reject a store signup (super_admin)
router.post('/reject/:signupId', superAdminAuth, async (req, res) => {
  try {
    const signup = await StoreSignup.findById(req.params.signupId);
    if (!signup) return res.status(404).json({ error: 'Signup not found' });
    signup.status = 'rejected';
    signup.reviewedBy = req.user.userId;
    signup.reviewedAt = new Date();
    await signup.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Helpers ──────────────────────────────────────────────────────────

var MAIN_POS_SERVICE = process.env.MAIN_POS_SERVICE || 'teschcross-git';

function isMainPos(serviceName) {
  if (!serviceName) return false;
  return serviceName === MAIN_POS_SERVICE || serviceName.startsWith('teschcross');
}

function buildTenantStatusEnvCommand(serviceName, region, status) {
  if (!serviceName) return null;
  return 'gcloud run services update ' + serviceName
    + ' --region=' + (region || 'europe-west1')
    + ' --update-env-vars=STOREFLOW_TENANT_STATUS=' + status;
}

// PUT /api/saas/stores/:id/suspend — plan to suspend a store (super_admin)
// DRY-RUN ONLY: generates plan + audit. Store/Deployment status NOT changed.
// POS enforcement requires running the returned envUpdateCommand in a later phase.
router.put('/:id/suspend', superAdminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required for suspend action' });
    }

    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const dep = await Deployment.findOne({ storeId: store._id }).select('serviceName status latestRevision').lean();
    if (dep && isMainPos(dep.serviceName)) {
      return res.status(403).json({ error: 'Cannot suspend Main POS service. This operation is blocked.' });
    }

    const currentStatus = store.status;
    const plannedStatus = 'suspended';

    // Audit plan only — do NOT change Store.status or Deployment.status
    await recordAudit(dep ? dep._id : null, 'suspend_plan', 'success', reason, req.user, {
      storeId: store._id.toString(), storeName: store.name,
      currentStatus, plannedStatus,
      serviceName: dep ? dep.serviceName : '',
      previousRevision: dep ? dep.latestRevision || '' : '',
      dryRun: true,
      dryRunEnvUpdate: buildTenantStatusEnvCommand(dep ? dep.serviceName : '', dep ? dep.region : 'europe-west1', plannedStatus)
    });

    res.json({
      success: true,
      plannedStatus,
      currentStatus,
      enforced: false,
      cloudRunEnvUpdated: false,
      storeId: store._id, storeName: store.name,
      serviceName: dep ? dep.serviceName : '',
      message: 'Plan generated only. Store status NOT changed. POS enforcement NOT active. Run envUpdateCommand to enforce.',
      envUpdateCommand: dep ? buildTenantStatusEnvCommand(dep.serviceName, dep.region || 'europe-west1', plannedStatus) : null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/freeze — plan to freeze a store (super_admin)
router.put('/:id/freeze', superAdminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required for freeze action' });
    }

    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const dep = await Deployment.findOne({ storeId: store._id }).select('serviceName status latestRevision').lean();
    if (dep && isMainPos(dep.serviceName)) {
      return res.status(403).json({ error: 'Cannot freeze Main POS service. This operation is blocked.' });
    }

    const currentStatus = store.status;
    const plannedStatus = 'frozen';

    await recordAudit(dep ? dep._id : null, 'freeze_plan', 'success', reason, req.user, {
      storeId: store._id.toString(), storeName: store.name,
      currentStatus, plannedStatus,
      serviceName: dep ? dep.serviceName : '',
      previousRevision: dep ? dep.latestRevision || '' : '',
      dryRun: true,
      dryRunEnvUpdate: buildTenantStatusEnvCommand(dep ? dep.serviceName : '', dep ? dep.region : 'europe-west1', plannedStatus)
    });

    res.json({
      success: true,
      plannedStatus,
      currentStatus,
      enforced: false,
      cloudRunEnvUpdated: false,
      storeId: store._id, storeName: store.name,
      serviceName: dep ? dep.serviceName : '',
      message: 'Plan generated only. Store status NOT changed. POS enforcement NOT active. Run envUpdateCommand to enforce.',
      envUpdateCommand: dep ? buildTenantStatusEnvCommand(dep.serviceName, dep.region || 'europe-west1', plannedStatus) : null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/activate — plan to activate a store (super_admin)
router.put('/:id/activate', superAdminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required for activate action' });
    }

    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const dep = await Deployment.findOne({ storeId: store._id }).select('serviceName status latestRevision').lean();
    if (dep && isMainPos(dep.serviceName)) {
      return res.status(403).json({ error: 'Cannot manage Main POS via tenant status API.' });
    }

    const currentStatus = store.status;
    const plannedStatus = 'active';

    await recordAudit(dep ? dep._id : null, 'activate_plan', 'success', reason, req.user, {
      storeId: store._id.toString(), storeName: store.name,
      currentStatus, plannedStatus,
      serviceName: dep ? dep.serviceName : '',
      previousRevision: dep ? dep.latestRevision || '' : '',
      dryRun: true,
      dryRunEnvUpdate: buildTenantStatusEnvCommand(dep ? dep.serviceName : '', dep ? dep.region : 'europe-west1', plannedStatus)
    });

    res.json({
      success: true,
      plannedStatus,
      currentStatus,
      enforced: false,
      cloudRunEnvUpdated: false,
      storeId: store._id, storeName: store.name,
      serviceName: dep ? dep.serviceName : '',
      message: 'Plan generated only. Store status NOT changed. POS enforcement NOT active. Run envUpdateCommand to enforce.',
      envUpdateCommand: dep ? buildTenantStatusEnvCommand(dep.serviceName, dep.region || 'europe-west1', plannedStatus) : null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/saas/stores/:id — delete a store permanently (super_admin, requires HHMM+PIN+reason+audit)
router.delete('/:id', superAdminAuth, async (req, res) => {
  try {
    const { actionCode, reason } = req.body;
    if (!actionCode) return res.status(400).json({ error: 'Verification code (HHMM+PIN) required' });
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason required for dangerous action' });

    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Require a deployment with PIN configured (Option A per spec)
    // Use storeId if available, fallback to storeName for legacy records
    const dep = await Deployment.findOne({
      $or: [
        { storeId: store._id },
        { storeName: store.name }
      ]
    }).sort({ storeId: -1 }).select('pinHash timezone');
    if (!dep || !dep.pinHash) {
      return res.status(400).json({ error: 'Store has no deployment PIN configured. Set a PIN via deployment settings before deleting.' });
    }

    // Verify HHMM+PIN via centralized verification
    var verification = await verifyActionCode(dep, actionCode);
    if (!verification.valid) {
      await recordAudit(dep._id, 'store_delete', 'failed', reason, req.user, { error: verification.error, ip: req.ip, storeId: store._id.toString(), storeName: store.name });
      return res.status(403).json({ error: verification.error });
    }

    // Delete all users associated with this store (protect super_admin)
    const delResult = await SaaSUser.deleteMany({ storeId: req.params.id, role: { $ne: 'super_admin' } });
    // Delete the store
    await Store.findByIdAndDelete(req.params.id);

    await recordAudit(dep._id, 'store_delete', 'success', reason, req.user, { storeId: store._id.toString(), storeName: store.name, usersDeleted: delResult.deletedCount });

    res.json({ success: true, message: 'Store and all associated users deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Super Admin Impersonation ───────────────────────────────────────────────

// POST /api/saas/stores/impersonate/:storeId — super_admin enters any store
router.post('/impersonate/:storeId', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Generate a scoped JWT that keeps super_admin role but targets this store
    const token = jwt.sign(
      { userId: req.user.userId, username: req.user.username, role: 'super_admin', storeId: req.params.storeId, impersonating: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, store: { id: store._id, name: store.name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Store settings API (store owner + super_admin) ─────────────────────────────

function storeOrSuperAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      if (decoded.role === 'super_admin') { req.user = decoded; return next(); }
      if (decoded.storeId === req.params.id && (decoded.role === 'store_root' || decoded.role === 'manager' || decoded.role === 'staff')) {
        req.user = decoded; return next();
      }
    } catch (e) { /* fall through */ }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/saas/stores/:id/settings — get store display settings
router.get('/:id/settings', storeOrSuperAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).select('name logo address phone email vatNumber receiptTC');
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/settings — update store display settings (super_admin + store_root only)
router.put('/:id/settings', storeOrSuperAuth, async (req, res) => {
  // manager/staff cannot write store settings
  if (req.user.role !== 'super_admin' && req.user.role !== 'store_root') {
    return res.status(403).json({ error: 'Only store owner can modify settings' });
  }
  try {
    const allowed = ['name', 'logo', 'address', 'phone', 'email', 'vatNumber', 'receiptTC'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    updates.updatedAt = new Date();
    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('name logo address phone email vatNumber receiptTC');
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ success: true, store });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Store User Management (super_admin + store_root) ──────────────────

// Auth: super_admin (any store) or store_root (own store only)
function storeUserAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      if (decoded.role === 'super_admin') { req.user = decoded; return next(); }
      if (decoded.role === 'store_root' && decoded.storeId === req.params.storeId) {
        req.user = decoded; return next();
      }
    } catch (e) { /* fall through */ }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// Store-root safety: forbid touching store_root or super_admin roles
function forbidElevatedRole(targetUser, operatorRole) {
  if (operatorRole === 'store_root') {
    if (targetUser.role === 'super_admin' || targetUser.role === 'store_root') {
      return 'Cannot manage users with ' + targetUser.role + ' role';
    }
  }
  return null;
}

// GET /api/saas/stores/:storeId/users — list store users
router.get('/:storeId/users', storeUserAdminAuth, async (req, res) => {
  try {
    const users = await SaaSUser.find(
      { storeId: req.params.storeId, role: { $ne: 'super_admin' } },
      '-password'
    ).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/saas/stores/:storeId/users — create a store user (store_root creates staff/manager only)
router.post('/:storeId/users', storeUserAdminAuth, async (req, res) => {
  try {
    const { username, password, displayName, email, role } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, password, and display name required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Store owner can only create staff/manager
    var targetRole = role || 'staff';
    if (req.user.role === 'store_root' && !['staff', 'manager'].includes(targetRole)) {
      return res.status(403).json({ error: 'Store owner can only create staff or manager users' });
    }
    if (!['staff', 'manager', 'store_root'].includes(targetRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Enforce plan user limit for store_root (super_admin override)
    if (req.user.role === 'store_root') {
      const store = await Store.findById(req.params.storeId).select('plan').lean();
      if (store) {
        var planLimits = getPlanLimits(store.plan);
        var userLimit = planLimits ? planLimits.users : null;
        if (userLimit != null) {
          var activeCount = await SaaSUser.countDocuments({ storeId: req.params.storeId, active: true });
          if (activeCount >= userLimit) {
            return res.status(403).json({ error: 'User limit reached for ' + store.plan + ' plan (' + userLimit + ' users)' });
          }
        }
      }
    }

    const existing = await SaaSUser.findOne({ username: username.trim() });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await SaaSUser.create({
      username: username.trim(),
      password: hashed,
      displayName: displayName.trim(),
      email: (email || '').trim().toLowerCase(),
      role: targetRole,
      storeId: req.params.storeId,
      active: true
    });

    res.json({ success: true, user: { id: user._id, username: user.username, displayName: user.displayName, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/saas/stores/:storeId/users/:userId — delete a store user
router.delete('/:storeId/users/:userId', storeUserAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findOne({ _id: req.params.userId, storeId: req.params.storeId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    // Store_root restrictions
    if (req.user.role === 'store_root') {
      var forbid = forbidElevatedRole(targetUser, 'store_root');
      if (forbid) return res.status(403).json({ error: forbid });
      // Cannot delete self
      if (targetUser._id.toString() === req.user.userId) {
        return res.status(403).json({ error: 'Cannot delete your own account' });
      }
      // Last store_root check
      if (targetUser.role === 'store_root') {
        const otherRoots = await SaaSUser.countDocuments({
          storeId: req.params.storeId,
          role: 'store_root',
          _id: { $ne: targetUser._id },
          active: true
        });
        if (otherRoots < 1) {
          return res.status(409).json({ error: 'Cannot delete the last active store owner' });
        }
      }
    }

    await SaaSUser.deleteOne({ _id: req.params.userId, storeId: req.params.storeId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:storeId/users/:userId — update user
router.put('/:storeId/users/:userId', storeUserAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findOne({ _id: req.params.userId, storeId: req.params.storeId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot edit super admin' });
    }

    if (req.user.role === 'store_root') {
      var forbid = forbidElevatedRole(targetUser, 'store_root');
      if (forbid) return res.status(403).json({ error: forbid });
      // Store owner cannot promote anyone to store_root
      if (req.body.role === 'store_root') {
        return res.status(403).json({ error: 'Cannot assign store_root role' });
      }
    }

    const { username, displayName, email, password, role } = req.body;

    if (username !== undefined) {
      if (!username.trim()) return res.status(400).json({ error: 'Username cannot be empty' });
      const existing = await SaaSUser.findOne({ username, _id: { $ne: targetUser._id } });
      if (existing) return res.status(409).json({ error: 'Username already taken' });
      targetUser.username = username.trim();
    }
    if (displayName !== undefined) {
      targetUser.displayName = displayName.trim() || targetUser.displayName;
    }
    if (email !== undefined) {
      targetUser.email = email.trim().toLowerCase() || targetUser.email;
    }
    if (password !== undefined) {
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      targetUser.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      targetUser.loginAttempts = 0;
      targetUser.lockUntil = null;
    }
    if (role !== undefined && req.user.role === 'super_admin') {
      if (['staff', 'manager', 'store_root'].includes(role)) {
        targetUser.role = role;
      }
    }

    targetUser.updatedAt = new Date();
    await targetUser.save();

    res.json({ success: true, user: { id: targetUser._id, username: targetUser.username, displayName: targetUser.displayName, email: targetUser.email, role: targetUser.role, active: targetUser.active } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:storeId/users/:userId/disable
router.put('/:storeId/users/:userId/disable', storeUserAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findOne({ _id: req.params.userId, storeId: req.params.storeId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot disable super admin' });
    }
    if (req.user.role === 'store_root') {
      var forbid = forbidElevatedRole(targetUser, 'store_root');
      if (forbid) return res.status(403).json({ error: forbid });
      if (targetUser._id.toString() === req.user.userId) {
        return res.status(403).json({ error: 'Cannot disable your own account' });
      }
      // Cannot disable the last active store_root
      if (targetUser.role === 'store_root') {
        const otherActive = await SaaSUser.countDocuments({
          storeId: req.params.storeId, role: 'store_root', _id: { $ne: targetUser._id }, active: true
        });
        if (otherActive < 1) {
          return res.status(409).json({ error: 'Cannot disable the last active store owner' });
        }
      }
    }
    targetUser.active = false;
    targetUser.updatedAt = new Date();
    await targetUser.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:storeId/users/:userId/enable
router.put('/:storeId/users/:userId/enable', storeUserAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findOne({ _id: req.params.userId, storeId: req.params.storeId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot enable super admin' });
    }
    if (req.user.role === 'store_root') {
      var forbid = forbidElevatedRole(targetUser, 'store_root');
      if (forbid) return res.status(403).json({ error: forbid });
    }
    targetUser.active = true;
    targetUser.updatedAt = new Date();
    await targetUser.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Password Management ─────────────────────────────────────────────────────

// POST /api/saas/stores/:storeId/users/:userId/reset-password
router.post('/:storeId/users/:userId/reset-password', storeUserAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findOne({ _id: req.params.userId, storeId: req.params.storeId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot reset super admin password' });
    }
    if (req.user.role === 'store_root') {
      var forbid = forbidElevatedRole(targetUser, 'store_root');
      if (forbid) return res.status(403).json({ error: forbid });
    }

    const crypto = require('crypto');
    const newPw = crypto.randomBytes(4).toString('hex') + 'X1!';
    const hashed = await bcrypt.hash(newPw, BCRYPT_SALT_ROUNDS);
    targetUser.password = hashed;
    targetUser.loginAttempts = 0;
    targetUser.lockUntil = null;
    targetUser.updatedAt = new Date();
    await targetUser.save();

    res.json({ success: true, username: targetUser.username, newPassword: newPw });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/saas/stores/:storeId/users/:userId/email-credentials
router.post('/:storeId/users/:userId/email-credentials', storeUserAdminAuth, async (req, res) => {
  try {
    const targetUser = await SaaSUser.findOne({ _id: req.params.userId, storeId: req.params.storeId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot reset super admin' });
    }
    if (req.user.role === 'store_root') {
      var forbid = forbidElevatedRole(targetUser, 'store_root');
      if (forbid) return res.status(403).json({ error: forbid });
    }
    if (!targetUser.email) {
      return res.status(400).json({ error: 'User has no email address' });
    }

    const newPw = require('crypto').randomBytes(4).toString('hex') + 'X1!';
    const hashed = await bcrypt.hash(newPw, BCRYPT_SALT_ROUNDS);
    targetUser.password = hashed;
    targetUser.loginAttempts = 0;
    targetUser.lockUntil = null;
    targetUser.updatedAt = new Date();
    await targetUser.save();

    // Try to send email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: targetUser.email,
        subject: 'Your TechCross SaaS Store Credentials',
        html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;background:#f5f5f7;padding:40px 20px;">'
          + '<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">'
          + '<div style="background:#0071e3;padding:24px;text-align:center;">'
          + '<h1 style="color:#fff;margin:0;font-size:20px;">TechCross SaaS</h1>'
          + '<p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px;">Store Account Credentials</p></div>'
          + '<div style="padding:24px;">'
          + '<p style="font-size:14px;color:#1d1d1f;">Hello <strong>' + targetUser.displayName + '</strong>,</p>'
          + '<p style="font-size:14px;color:#6e6e73;">Your TechCross SaaS store account has been set up. Use the credentials below to sign in.</p>'
          + '<div style="background:#f5f5f7;border-radius:12px;padding:16px;margin:16px 0;">'
          + '<p style="margin:0 0 8px;font-size:13px;color:#6e6e73;"><strong>Login:</strong> <a href="https://techcross.ie/saas/login.html" style="color:#0071e3;">https://techcross.ie/saas/login.html</a></p>'
          + '<p style="margin:0 0 8px;font-size:13px;color:#6e6e73;"><strong>Username:</strong> ' + targetUser.username + '</p>'
          + '<p style="margin:0;font-size:13px;color:#6e6e73;"><strong>Password:</strong> ' + newPw + '</p></div>'
          + '<p style="font-size:12px;color:#8e8e93;">For security, please change your password after signing in.</p></div></div></body></html>'
      });
      res.json({ success: true, message: 'Credentials emailed to ' + targetUser.email, username: targetUser.username });
    } catch (emailErr) {
      console.error('Failed to email credentials:', emailErr.message);
      res.json({ success: true, message: 'Password reset. Email delivery failed (' + emailErr.message + '). Contact the user directly to share credentials.' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/saas/stores/:id/password — store owner changes their own password
router.put('/:id/password', storeOrSuperAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await SaaSUser.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.password = hashed;
    user.updatedAt = new Date();
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Deploy Main POS Clone ──────────────────────────────────────────────

// POST /api/saas/stores/:id/deploy-mainpos-clone
// Super admin only. Requires PIN + reason validation.
// Triggers Cloud Build → Cloud Run deploy of Main POS code as a tenant store.
router.post('/:id/deploy-mainpos-clone', superAdminAuth, async (req, res) => {
  try {
    const { actionCode, reason } = req.body;
    if (!actionCode) {
      return res.status(400).json({ error: 'Verification code (HHMM+PIN) required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required for deploy action' });
    }

    // Resolve store → deployment
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const dep = await Deployment.findOne({ storeId: store._id }).select('pinHash timezone serviceName region status');
    if (!dep) {
      return res.status(404).json({ error: 'No deployment found for this store. Approve signup first.' });
    }
    if (dep.status === 'suspended' || dep.status === 'readonly_frozen') {
      return res.status(400).json({ error: 'Store is ' + dep.status + '. Activate before deploying.' });
    }

    // Verify HHMM+PIN
    const { verifyActionCode, recordAudit } = require('../../utils/deployment-security');
    const verification = await verifyActionCode(dep, actionCode);
    if (!verification.valid) {
      await recordAudit(dep._id, 'deploy_mainpos_clone', 'failed', reason, req.user, {
        error: verification.error, ip: req.ip,
        storeId: store._id.toString(), storeName: store.name
      });
      return res.status(403).json({ error: verification.error });
    }

    // Record pre-deploy state
    const prevRevision = dep.latestRevision || '';

    // Run deployment via script (child process)
    const { spawn } = require('child_process');
    const scriptPath = require('path').join(__dirname, '../../scripts/deploy-tenant-store.js');

    console.log('[stores] Starting deploy for store:', store.name, 'service:', dep.serviceName);

    const child = spawn('node', [scriptPath, dep._id.toString()], {
      cwd: require('path').join(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });

    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
      child.on('error', () => resolve(1));
    });

    // Read updated deployment
    const updatedDep = await Deployment.findById(dep._id).lean();

    await recordAudit(dep._id, 'deploy_mainpos_clone', exitCode === 0 ? 'success' : 'failed', reason, req.user, {
      exitCode, storeId: store._id.toString(), storeName: store.name,
      serviceName: dep.serviceName,
      previousRevision: prevRevision,
      latestRevision: updatedDep ? updatedDep.latestRevision : '',
      rollbackCommand: updatedDep ? updatedDep.rollbackCommand : '',
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-2000)
    });

    if (exitCode !== 0) {
      return res.status(500).json({
        error: 'Deploy failed',
        exitCode,
        stderr: stderr.slice(-1000),
        details: 'Check server logs for full output'
      });
    }

    res.json({
      success: true,
      store: store.name,
      serviceName: dep.serviceName,
      previousRevision: prevRevision,
      latestRevision: updatedDep ? updatedDep.latestRevision : '',
      cloudRunUrl: updatedDep ? updatedDep.cloudRunUrl : '',
      rollbackCommand: updatedDep ? updatedDep.rollbackCommand : '',
      healthStatus: updatedDep ? updatedDep.lastHealthStatus : '',
      message: 'Main POS clone deployed. Run rollback command if store is unhealthy.'
    });

  } catch (e) {
    console.error('[stores] deploy-mainpos-clone error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── Database Hosting (Phase 3A — read-only) ─────────────────
// GET /api/saas/stores/:storeId/database
// Returns database hosting info for a store. Super admin only.

router.get('/:storeId/database', superAdminAuth, async (req, res) => {
  try {
    var store = await Store.findById(req.params.storeId).select(
      'databaseMode managedDbName storageLimitMB storageUsedMB storageLastCheckedAt ' +
      'backupPolicy lastBackupAt byoMongoConfigured byoMongoDbName dataRegion allowDataExport plan'
    ).lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });

    res.json({
      storeId: store._id,
      plan: store.plan,
      databaseMode: store.databaseMode || 'managed',
      managedDbName: store.managedDbName || null,
      storageLimitMB: store.storageLimitMB || 100,
      storageUsedMB: store.storageUsedMB || 0,
      storageLastCheckedAt: store.storageLastCheckedAt || null,
      backupPolicy: store.backupPolicy || 'none',
      lastBackupAt: store.lastBackupAt || null,
      byoMongoConfigured: store.byoMongoConfigured || false,
      byoMongoDbName: store.byoMongoDbName || null,
      dataRegion: store.dataRegion || 'europe-west1',
      allowDataExport: store.allowDataExport || false
    });
  } catch (e) {
    console.error('[stores] database GET error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── StoreFlow Module/Permission (Phase 1A — read-only) ──────────
// GET /api/saas/stores/:storeId/modules
// Returns the effective module state for a store.
// Super admin only. Read-only. No writes.

const { STOREFLOW_MODULES, getAllModuleKeys } = require('../../utils/storeflow-modules');
const { STOREFLOW_PLANS, getPlanOrDefault } = require('../../utils/storeflow-plans');
const { getStoreEnabledModules, getRoleDefaultPermissions } = require('../../utils/storeflow-permissions');

router.get('/:storeId/modules', superAdminAuth, async (req, res) => {
  try {
    var store = await Store.findById(req.params.storeId).lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });

    var plan = getPlanOrDefault(store.plan);
    var enabled = getStoreEnabledModules(store);
    var disabled = store.disabledModules || [];

    // Build module details with status
    var moduleDetails = {};
    getAllModuleKeys().forEach(function(key) {
      var mod = STOREFLOW_MODULES[key];
      var allowedByPlan = plan.allowedModules.indexOf(key) !== -1;
      var isEnabled = enabled.indexOf(key) !== -1;
      moduleDetails[key] = {
        key: key,
        name: mod.name,
        category: mod.category,
        required: mod.required || false,
        allowedByPlan: allowedByPlan,
        enabled: isEnabled,
        permissions: mod.permissions
      };
    });

    res.json({
      store: {
        _id: store._id,
        name: store.name,
        plan: store.plan,
        subscriptionStatus: store.subscriptionStatus,
        trialEndsAt: store.trialEndsAt,
        status: store.status,
        enabledModules: enabled,
        disabledModules: disabled
      },
      plan: {
        key: plan.key,
        name: plan.name,
        allowedModules: plan.allowedModules,
        defaultModules: plan.defaultEnabledModules,
        limits: plan.limits,
        features: plan.features
      },
      modules: moduleDetails,
      roleDefaults: {
        root: getRoleDefaultPermissions('root', store),
        manager: getRoleDefaultPermissions('manager', store),
        staff: getRoleDefaultPermissions('staff', store)
      }
    });
  } catch (e) {
    console.error('[stores] modules error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── StoreFlow Module/Permission (Phase 2B — writable) ───────
// PUT /api/saas/stores/:storeId/modules
// Super admin only. Updates store enabledModules/disabledModules.
// Required core modules (pos, products, transactions) cannot be disabled.
// Modules not allowed by plan trigger a warning but are not blocked.
// Does NOT trigger tenant redeploy or env updates.

const { getPlanLimits } = require('../../utils/storeflow-plans');

router.put('/:storeId/modules', superAdminAuth, async (req, res) => {
  try {
    var store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    var { enabledModules, disabledModules } = req.body;

    if (!Array.isArray(enabledModules)) {
      return res.status(400).json({ error: 'enabledModules must be an array' });
    }
    if (disabledModules && !Array.isArray(disabledModules)) {
      return res.status(400).json({ error: 'disabledModules must be an array' });
    }

    // Validate all module keys exist in registry
    var allKeys = getAllModuleKeys();
    var unknownModules = [];
    enabledModules.forEach(function(k) {
      if (allKeys.indexOf(k) === -1) unknownModules.push(k);
    });
    if (disabledModules) {
      disabledModules.forEach(function(k) {
        if (allKeys.indexOf(k) === -1) unknownModules.push(k);
      });
    }
    if (unknownModules.length > 0) {
      return res.status(400).json({ error: 'Unknown module keys: ' + unknownModules.join(', ') });
    }

    // Enforce required core modules are enabled
    var requiredKeys = Object.values(STOREFLOW_MODULES).filter(function(m) { return m.required; }).map(function(m) { return m.key; });
    var missingRequired = requiredKeys.filter(function(k) { return enabledModules.indexOf(k) === -1; });
    if (missingRequired.length > 0) {
      return res.status(400).json({ error: 'Required core modules cannot be disabled: ' + missingRequired.join(', ') });
    }

    // Warn on modules not allowed by plan (but allow — Admin may upgrade plan later)
    var plan = getPlanOrDefault(store.plan);
    var planAllowed = plan.allowedModules;
    var beyondPlan = enabledModules.filter(function(k) { return planAllowed.indexOf(k) === -1; });
    var warnings = [];
    if (beyondPlan.length > 0) {
      warnings.push('Modules beyond plan "' + store.plan + '": ' + beyondPlan.join(', ') + '. Plan upgrade may be needed.');
    }

    // Build clean disabled list: all known modules NOT in enabled
    var computedDisabled = allKeys.filter(function(k) { return enabledModules.indexOf(k) === -1; });
    var finalDisabled = disabledModules || computedDisabled;

    // Save
    store.enabledModules = enabledModules;
    store.disabledModules = finalDisabled;
    store.updatedAt = new Date();
    await store.save();

    // Build response mirroring GET modules
    var enabled = getStoreEnabledModules(store);
    var moduleDetails = {};
    allKeys.forEach(function(key) {
      var mod = STOREFLOW_MODULES[key];
      var allowedByPlan = planAllowed.indexOf(key) !== -1;
      var isEnabled = enabled.indexOf(key) !== -1;
      moduleDetails[key] = {
        key: key,
        name: mod.name,
        category: mod.category,
        required: mod.required || false,
        allowedByPlan: allowedByPlan,
        enabled: isEnabled,
        permissions: mod.permissions
      };
    });

    res.json({
      success: true,
      store: {
        _id: store._id,
        name: store.name,
        plan: store.plan,
        subscriptionStatus: store.subscriptionStatus,
        enabledModules: enabled,
        disabledModules: finalDisabled
      },
      plan: { key: plan.key, name: plan.name, allowedModules: planAllowed, limits: plan.limits },
      modules: moduleDetails,
      warnings: warnings.length > 0 ? warnings : undefined,
      message: 'Module configuration saved. Redeploy tenant for changes to take effect in POS.'
    });
  } catch (e) {
    console.error('[stores] modules PUT error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── Public Store Info by Slug ───────────────────────────────────────
// GET /api/saas/stores/slug/:slug — public, no auth, returns store branding
router.get('/slug/:slug', async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug }).select('name slug logo plan status').lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ name: store.name, slug: store.slug, logo: store.logo || null, plan: store.plan, status: store.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
