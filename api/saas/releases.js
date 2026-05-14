const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const url = require('url');

const Release = require('../../models/saas/Release');
const StoreUpgrade = require('../../models/saas/StoreUpgrade');
const Deployment = require('../../models/saas/Deployment');
const Store = require('../../models/saas/Store');
const gcp = require('../../utils/gcp-admin');
const { verifyActionCode, recordAudit } = require('../../utils/deployment-security');
const { maskMongoUri } = require('../../utils/mongo-uri-validator');

const JWT_SECRET = process.env.SAAS_JWT_SECRET;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'project-0bb407e6-67ba-4d3e-8da';
const MAIN_POS_SERVICE = process.env.MAIN_POS_SERVICE || 'teschcross-git';

// ─── Auth ──────────────────────────────────────────────────────────
function superAdminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
      if (decoded.role === 'super_admin') { req.user = decoded; return next(); }
    } catch (e) { /* fall through */ }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// ─── Helpers ───────────────────────────────────────────────────────
function sanitizeEnvVal(val) {
  return String(val || '').replace(/[^a-zA-Z0-9_.\-:@/=]/g, '_');
}

function generateSecret(len) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

function httpGet(targetUrl) {
  return new Promise(function(resolve, reject) {
    var p = url.parse(targetUrl);
    var req = https.request({
      hostname: p.hostname, port: p.port || 443, path: p.path,
      method: 'GET', timeout: 10000, headers: { 'Accept': 'application/json' }
    }, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        res.statusCode === 200 ? resolve(d) : reject(new Error('HTTP ' + res.statusCode));
      });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ─── POST /api/saas/releases ────────────────────────────────────────
router.post('/', superAdminAuth, async (req, res) => {
  try {
    var release = await Release.create({
      version: req.body.version || 'v' + Date.now().toString(36),
      gitCommit: req.body.gitCommit || '',
      status: 'draft',
      testDeploymentId: req.body.testDeploymentId || '',
      testServiceName: req.body.testServiceName || '',
      notes: req.body.notes || '',
      createdBy: req.user.userId
    });
    res.status(201).json(release);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /api/saas/releases/:id/mark-test-passed ──────────────────
router.post('/:id/mark-test-passed', superAdminAuth, async (req, res) => {
  try {
    var { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required' });
    }
    var release = await Release.findById(req.params.id);
    if (!release) return res.status(404).json({ error: 'Release not found' });
    if (release.status !== 'testing' && release.status !== 'draft') {
      return res.status(400).json({ error: 'Release must be in draft or testing status. Current: ' + release.status });
    }
    release.status = 'test_passed';
    release.approvedBy = req.user.userId;
    release.approvedAt = new Date();
    release.notes = (release.notes || '') + '\nTest passed: ' + reason;
    await release.save();
    res.json({ success: true, release });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /api/saas/releases/:id/rollout-all ────────────────────────
router.post('/:id/rollout-all', superAdminAuth, async (req, res) => {
  try {
    var { actionCode, reason, continueOnFailure, includeMainPos } = req.body;
    if (!actionCode) {
      return res.status(400).json({ error: 'Verification code (HHMM+PIN) required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required for rollout action' });
    }

    // Load release
    var release = await Release.findById(req.params.id);
    if (!release) return res.status(404).json({ error: 'Release not found' });
    if (release.status !== 'test_passed') {
      return res.status(400).json({ error: 'Release must be in test_passed status. Current: ' + release.status });
    }

    // Verify PIN using any deployment that has a PIN configured
    var verifyDep = await Deployment.findOne({ status: 'running', pinHash: { $ne: '' } }).select('pinHash timezone');
    if (!verifyDep) {
      verifyDep = await Deployment.findOne({ pinHash: { $ne: '' } }).select('pinHash timezone');
    }
    if (!verifyDep || !verifyDep.pinHash) {
      return res.status(400).json({ error: 'No deployment with PIN configured. Set a PIN first.' });
    }

    var verification = await verifyActionCode(verifyDep, actionCode);
    if (!verification.valid) {
      return res.status(403).json({ error: verification.error });
    }

    // Build query for target deployments
    var query = { status: 'running' };
    if (!includeMainPos) {
      query.serviceName = { $ne: MAIN_POS_SERVICE };
    }

    var targets = await Deployment.find(query).lean();

    if (targets.length === 0) {
      return res.status(400).json({ error: 'No eligible deployments to roll out to' });
    }

    // Mark release as rolling_out
    release.status = 'rolling_out';
    release.rolloutStartedAt = new Date();
    await release.save();

    console.log('[releases] Starting rollout for release', release._id, 'to', targets.length, 'stores');

    // Create StoreUpgrade records
    var upgrades = [];
    for (var i = 0; i < targets.length; i++) {
      var d = targets[i];
      var ug = await StoreUpgrade.create({
        releaseId: release._id,
        storeId: d.storeId,
        deploymentId: d._id,
        serviceName: d.serviceName,
        region: d.region || 'europe-west1',
        status: 'pending'
      });
      upgrades.push(ug);
    }

    res.status(202).json({
      accepted: true,
      release: release._id,
      totalStores: targets.length,
      message: 'Rollout started. Stores will be upgraded sequentially.'
    });

    // ─── Run rollout sequentially in background ──────────────────
    deployStoresAsync(release._id, targets, upgrades, !!continueOnFailure)
      .catch(function(e) {
        console.error('[releases] Rollout async error:', e.message);
      });
  } catch (e) {
    console.error('[releases] rollout-all error:', e.message);
    try { res.status(500).json({ error: e.message }); } catch (_) {}
  }
});

async function deployStoresAsync(releaseId, targets, upgrades, continueOnFailure) {
  var failed = false;
  var release = await Release.findById(releaseId);

  for (var i = 0; i < targets.length; i++) {
    var dep = targets[i];
    var ug = upgrades[i];
    var store = await Store.findById(dep.storeId).lean();
    var storeName = store ? store.name : dep.storeName;
    var serviceName = dep.serviceName;
    var region = dep.region || 'europe-west1';

    console.log('[releases] Deploying store', i + 1, 'of', targets.length, ':', serviceName);

    // Skip if already failed and not continuing
    if (failed && !continueOnFailure) {
      ug.status = 'skipped';
      ug.error = 'Previous store failed, rollout stopped';
      ug.finishedAt = new Date();
      await ug.save();
      continue;
    }

    try {
      // Record previous revision
      var prevRev = '';
      try {
        prevRev = await gcp.getLatestReadyRevision(PROJECT_ID, region, serviceName);
      } catch (e) {
        console.log('[releases] No previous revision for', serviceName, '(new service?)');
      }

      ug.previousRevision = prevRev || '';
      ug.status = 'deploying';
      ug.startedAt = new Date();
      await ug.save();

      // Retrieve MongoDB URI
      var fullDep = await Deployment.findById(dep._id).select('+mongoUri').lean();
      var mongoUri = fullDep.mongoUri || process.env.DBCon;

      if (!mongoUri) {
        throw new Error('MongoDB URI not available for ' + serviceName);
      }

      // Generate fresh env secrets
      var invJwtSecret = generateSecret(48);
      var invAuditKey = generateSecret(32);

      var env = {
        DBCon: mongoUri,
        INV_JWT_SECRET: invJwtSecret,
        INV_AUDIT_KEY: invAuditKey,
        STORE_NAME: sanitizeEnvVal(serviceName).slice(0, 63) || 'storeflow',
        STORE_FROZEN: 'false',
        NODE_ENV: 'production',
        DOMAIN: sanitizeEnvVal(process.env.DOMAIN || 'techcross.ie'),
        COMPANY_NAME: sanitizeEnvVal(storeName || serviceName),
        GCP_PROJECT: sanitizeEnvVal(PROJECT_ID),
        GCP_REGION: sanitizeEnvVal(region)
      };

      // Deploy
      var buildResult = await gcp.triggerDeployBuild(
        PROJECT_ID, region, serviceName, storeName, mongoUri, env, ''
      );

      var newRev = buildResult.revisionName || '';
      var serviceUrl = buildResult.serviceUrl || '';

      // Health check
      if (!serviceUrl) {
        try { serviceUrl = await gcp.getServiceUrl(PROJECT_ID, region, serviceName); } catch (_) {}
      }
      if (!newRev) {
        try { newRev = await gcp.getLatestReadyRevision(PROJECT_ID, region, serviceName); } catch (_) {}
      }

      var healthy = false;
      if (serviceUrl) {
        for (var hc = 1; hc <= 8; hc++) {
          await sleep(5000);
          try {
            var hcResult = await httpGet(serviceUrl + '/api/health');
            if (hcResult) {
              var parsed = JSON.parse(hcResult);
              if (parsed.status === 'ok' || parsed.mongo === 1) {
                healthy = true;
                if (parsed.revision) newRev = parsed.revision;
                break;
              }
            }
          } catch (_) { /* retry */ }
        }
      }

      // Build rollback command
      var rollbackCmd = '';
      if (prevRev) {
        rollbackCmd = 'gcloud run services update-traffic ' + serviceName
          + ' --region=' + region + ' --to-revisions ' + prevRev + '=100';
      }

      // Update deployment record
      await Deployment.findByIdAndUpdate(dep._id, {
        previousRevision: prevRev || '',
        latestRevision: newRev,
        rollbackCommand: rollbackCmd,
        cloudRunUrl: serviceUrl,
        deployedAt: new Date(),
        lastHealthCheck: new Date(),
        lastHealthStatus: healthy ? 'healthy' : 'unhealthy',
        updatedAt: new Date()
      });

      // Update store upgrade record
      ug.newRevision = newRev;
      ug.rollbackCommand = rollbackCmd;
      ug.status = healthy ? 'healthy' : 'failed';
      ug.healthResult = healthy ? 'ok' : 'unhealthy';
      ug.error = healthy ? '' : 'Health check failed';
      ug.finishedAt = new Date();
      await ug.save();

      if (!healthy) failed = true;

      console.log('[releases] Store', serviceName, healthy ? 'HEALTHY' : 'UNHEALTHY', 'rev:', newRev);
    } catch (e) {
      console.error('[releases] Store', serviceName, 'FAILED:', e.message);
      ug.status = 'failed';
      ug.error = e.message;
      ug.finishedAt = new Date();
      await ug.save();
      failed = true;
    }
  }

  // Mark release completed or failed
  release.status = failed ? 'failed' : 'completed';
  release.rolloutFinishedAt = new Date();
  await release.save();
  console.log('[releases] Rollout', release.status, 'for release', releaseId);
}

// ─── GET /api/saas/releases ─────────────────────────────────────────
router.get('/', superAdminAuth, async (req, res) => {
  try {
    var releases = await Release.find({}).sort({ createdAt: -1 }).lean();
    res.json(releases);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/saas/releases/:id ─────────────────────────────────────
router.get('/:id', superAdminAuth, async (req, res) => {
  try {
    var release = await Release.findById(req.params.id).lean();
    if (!release) return res.status(404).json({ error: 'Release not found' });
    var upgrades = await StoreUpgrade.find({ releaseId: req.params.id }).lean();
    res.json({ release, upgrades });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /api/saas/releases/:id/stores/:storeId/rollback ──────────
// Rollback one store from StoreUpgrade.previousRevision.
router.post('/:id/stores/:storeId/rollback', superAdminAuth, async (req, res) => {
  try {
    var { actionCode, reason, includeMainPos } = req.body;
    if (!actionCode) {
      return res.status(400).json({ error: 'Verification code (HHMM+PIN) required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason required for rollback' });
    }

    var release = await Release.findById(req.params.id);
    if (!release) return res.status(404).json({ error: 'Release not found' });

    // Find latest StoreUpgrade for this release + store
    var store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    var ug = await StoreUpgrade.findOne({
      releaseId: release._id,
      storeId: req.params.storeId
    }).sort({ createdAt: -1 });

    if (!ug) {
      return res.status(404).json({ error: 'No upgrade record found for this store in this release' });
    }

    // Safety: block Main POS unless explicitly allowed
    if (!includeMainPos && ug.serviceName === MAIN_POS_SERVICE) {
      return res.status(403).json({ error: 'Cannot rollback Main POS service. Set includeMainPos=true if intended.' });
    }

    // Block if no previous revision to roll back to
    if (!ug.previousRevision) {
      return res.status(400).json({ error: 'No previous revision available. This was the first deployment.' });
    }

    // Block double-rollback
    if (ug.status === 'rolled_back') {
      return res.status(400).json({ error: 'Store was already rolled back on this release.' });
    }

    // Verify PIN
    var verifyDep = await Deployment.findOne({ serviceName: ug.serviceName }).select('pinHash timezone');
    if (!verifyDep || !verifyDep.pinHash) {
      verifyDep = await Deployment.findOne({ pinHash: { $ne: '' } }).select('pinHash timezone');
    }
    if (!verifyDep || !verifyDep.pinHash) {
      return res.status(400).json({ error: 'No deployment with PIN configured for verification.' });
    }

    var verification = await verifyActionCode(verifyDep, actionCode);
    if (!verification.valid) {
      await recordAudit(ug.deploymentId || verifyDep._id, 'store_rollback', 'failed', reason, req.user, {
        error: verification.error,
        releaseId: release._id, serviceName: ug.serviceName,
        storeId: req.params.storeId,
        previousRevision: ug.previousRevision
      });
      return res.status(403).json({ error: verification.error });
    }

    // Execute rollback: switch traffic to previous revision
    console.log('[releases] Rolling back', ug.serviceName, 'to', ug.previousRevision);

    try {
      await gcp.switchTraffic(PROJECT_ID, ug.region, ug.serviceName, ug.previousRevision, 100);
    } catch (e) {
      ug.status = 'failed';
      ug.error = 'rollback switchTraffic failed: ' + e.message;
      ug.finishedAt = new Date();
      await ug.save();

      await recordAudit(ug.deploymentId || '', 'store_rollback', 'failed', reason, req.user, {
        error: e.message,
        releaseId: release._id, serviceName: ug.serviceName,
        storeId: req.params.storeId,
        previousRevision: ug.previousRevision
      });
      return res.status(500).json({ error: 'Rollback traffic switch failed: ' + e.message });
    }

    // Update upgrade record
    ug.status = 'rolled_back';
    ug.error = '';
    ug.finishedAt = new Date();
    await ug.save();

    // Update deployment record
    await Deployment.findOneAndUpdate(
      { serviceName: ug.serviceName },
      { latestRevision: ug.previousRevision, status: 'running', updatedAt: new Date() }
    );

    // Update release if needed
    if (release.status === 'completed' || release.status === 'failed') {
      release.status = 'rolled_back';
      release.notes = (release.notes || '') + '\nStore ' + store.name + ' (' + ug.serviceName + ') rolled back: ' + reason;
      await release.save();
    }

    await recordAudit(ug.deploymentId || '', 'store_rollback', 'success', reason, req.user, {
      releaseId: release._id, serviceName: ug.serviceName,
      storeId: req.params.storeId,
      previousRevision: ug.previousRevision,
      rollbackCommand: ug.rollbackCommand
    });

    res.json({
      success: true,
      storeName: store.name,
      serviceName: ug.serviceName,
      restoredRevision: ug.previousRevision,
      rollbackCommand: ug.rollbackCommand,
      message: 'Traffic switched to ' + ug.previousRevision + '. Store has been rolled back.'
    });
  } catch (e) {
    console.error('[releases] rollback error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
