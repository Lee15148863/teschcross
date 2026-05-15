/**
 * deploy-tenant-store.js — Deploy Main POS clone to a tenant's Cloud Run service.
 *
 * Orchestrates:
 *   1. Load store + deployment metadata from StoreFlow admin DB
 *   2. Retrieve MongoDB URI (Secret Manager → fallback to deployment record)
 *   3. Validate URI format + connectivity
 *   4. Generate per-store env vars (INV_JWT_SECRET, DBCon, etc.)
 *   5. Record current revision for rollback
 *   6. Trigger Cloud Build → Cloud Run deploy
 *   7. Poll for completion
 *   8. Health check
 *   9. Update deployment record
 *
 * Usage:
 *   node scripts/deploy-tenant-store.js <deploymentId|storeId>
 *
 * Safety:
 *   - BLOCKED on service names matching Main POS prefixes
 *   - Never logs full MongoDB URI
 *   - Never copies TechCross production data
 *   - Does not touch real Main POS Cloud Run service
 */
require('dotenv').config();

const mongoose = require('mongoose');
const crypto = require('crypto');
const https = require('https');
const url = require('url');

const Deployment = require('../models/saas/Deployment');
const Store = require('../models/saas/Store');
const gcp = require('../utils/gcp-admin');
const sm = require('../utils/gcp-secret-manager');
const { validateMongoUri, maskMongoUri, parseMongoDbName } = require('../utils/mongo-uri-validator');

const DB = process.env.DBCon || process.env.MONGO_URI;
const DB_NAME = process.env.STORE_NAME || 'techcross';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'project-0bb407e6-67ba-4d3e-8da';
const REGION = 'europe-west1';

// ─── Helpers ──────────────────────────────────────────────────────────

function mask(val) {
  if (!val || val.length < 8) return '***';
  return val.slice(0, 4) + '****' + val.slice(-4);
}

function generateSecret(len) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(deployOrStoreId) {
  if (!deployOrStoreId) {
    console.error('Usage: node scripts/deploy-tenant-store.js <deploymentId|storeId>');
    process.exit(1);
  }
  if (!DB) {
    console.error('FATAL: DBCon is not set. Cannot connect to StoreFlow admin DB.');
    process.exit(1);
  }

  console.log('⏳ Connecting to StoreFlow admin DB...');
  await mongoose.connect(DB, { dbName: DB_NAME });
  console.log('✓ Connected to StoreFlow admin DB');

  // 1. Load deployment record
  var dep = await Deployment.findById(deployOrStoreId)
    .select('+mongoUri')
    .lean();

  // Fallback: try as storeId
  if (!dep) {
    dep = await Deployment.findOne({ storeId: deployOrStoreId })
      .select('+mongoUri')
      .lean();
  }

  if (!dep) {
    console.error('FATAL: Deployment not found for id:', deployOrStoreId);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('✓ Loaded deployment for store:', dep.storeName);
  console.log('  serviceName:', dep.serviceName);
  console.log('  region:', dep.region || REGION);
  console.log('  status:', dep.status);

  var store = await Store.findById(dep.storeId).lean();
  if (!store) {
    console.warn('⚠  Store metadata not found (may be deleted) — continuing with deployment record');
  }

  var serviceName = dep.serviceName;
  var region = dep.region || REGION;
  var storeName = store ? store.name : dep.storeName;

  // 2. Retrieve MongoDB URI
  var mongoUri = null;

  if (dep.mongoUriStorageMode === 'secret_manager' && dep.mongoUriSecretName) {
    console.log('  Reading MongoDB URI from Secret Manager...');
    try {
      mongoUri = await sm.retrieveMongoUri(
        dep.mongoUriSecretName,
        dep.mongoUriSecretVersion || 'latest',
        PROJECT_ID
      );
    } catch (e) {
      console.warn('  Secret Manager read failed:', e.message, '— falling back to deployment record');
    }
  }

  if (!mongoUri && dep.mongoUri) {
    mongoUri = dep.mongoUri;
  }

  if (!mongoUri) {
    console.error('FATAL: MongoDB URI not found. Check deployment has mongoUri or Secret Manager reference.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('✓ MongoDB URI retrieved [' + maskMongoUri(mongoUri) + ']');

  // 3. Validate MongoDB URI
  console.log('  Validating MongoDB URI...');
  var valResult = await validateMongoUri(mongoUri, {
    mainPosDbName: process.env.STORE_NAME || 'techcross',
    adminDbName: 'saas_admin',
    timeoutMs: 10000
  });

  if (!valResult.ok) {
    console.error('FATAL: MongoDB URI validation failed:', valResult.message || 'Unknown error');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('✓ URI validation passed (db:', valResult.dbName + ')');

  // 4. Generate env vars
  var invJwtSecret = generateSecret(48);
  var invAuditKey = generateSecret(32);

  // Sanitize env var values: no spaces, no special shell chars
  function sanitizeEnvVal(val) {
    return String(val || '').replace(/[^a-zA-Z0-9_.\-:@/=]/g, '_');
  }

  // Derive STORE_NAME from MongoDB URI database name, NOT from serviceName.
  // serviceName uses hyphens (storeflow-test-mainpos), DB names use underscores.
  var dbName = parseMongoDbName(mongoUri);
  if (!dbName) {
    console.error('FATAL: Cannot extract database name from MongoDB URI');
    console.error('  Ensure URI includes /dbname, e.g. mongodb+srv://.../storeflow_mystore');
    await mongoose.disconnect();
    process.exit(1);
  }
  var storeNameEnv = dbName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 63);

  var env = {
    DBCon: mongoUri,
    INV_JWT_SECRET: invJwtSecret,
    INV_AUDIT_KEY: invAuditKey,
    STORE_NAME: storeNameEnv,
    STORE_FROZEN: 'false',
    NODE_ENV: 'production',
    DOMAIN: sanitizeEnvVal(process.env.DOMAIN || 'techcross.ie'),
    COMPANY_NAME: sanitizeEnvVal(storeName || 'StoreFlow_Store'),
    COMPANY_EMAIL: sanitizeEnvVal(store ? store.email : ''),
    GCP_PROJECT: sanitizeEnvVal(PROJECT_ID),
    GCP_REGION: sanitizeEnvVal(region)
  };

  console.log('✓ Generated env vars:');
  console.log('  DBCon: [' + maskMongoUri(mongoUri) + ']');
  console.log('  INV_JWT_SECRET: [' + mask(invJwtSecret) + ']');
  console.log('  INV_AUDIT_KEY: [' + mask(invAuditKey) + ']');
  console.log('  STORE_NAME: ' + env.STORE_NAME + ' (from URI dbName: ' + dbName + ')');

  // 5. Record current revision for rollback
  var previousRevision = '';
  try {
    previousRevision = await gcp.getLatestReadyRevision(PROJECT_ID, region, serviceName);
  } catch (e) {
    console.log('  Note: no previous revision found (new service)');
  }
  console.log('  Previous revision:', previousRevision || '(none — new service)');

  // Mark as deploying
  await Deployment.findByIdAndUpdate(dep._id, {
    status: 'deploying',
    error: '',
    updatedAt: new Date()
  });

  // 6. Trigger Cloud Build → Cloud Run deploy
  console.log('  Triggering Cloud Build deploy...');
  var buildResult;
  try {
    buildResult = await gcp.triggerDeployBuild(
      PROJECT_ID,
      region,
      serviceName,
      storeName,
      mongoUri,
      env,
      ''
    );
  } catch (e) {
    console.error('FATAL: Deploy trigger failed:', e.message);
    await Deployment.findByIdAndUpdate(dep._id, {
      status: 'failed',
      error: 'trigger failed: ' + e.message,
      updatedAt: new Date(),
    });
    await mongoose.disconnect();
    process.exit(1);
  }

  var buildId = buildResult.buildId;
  var serviceUrl = buildResult.serviceUrl || '';
  var newRevision = buildResult.revisionName || '';
  console.log('✓ Deploy succeeded — revision:', newRevision);
  if (serviceUrl) console.log('  URL:', serviceUrl);

  // 7. Health check (gcloud deploy is synchronous, service should be ready)
  console.log('  Running health check...');
  var healthy = false;

  if (!newRevision || !serviceUrl) {
    try {
      serviceUrl = await gcp.getServiceUrl(PROJECT_ID, region, serviceName);
      newRevision = await gcp.getLatestReadyRevision(PROJECT_ID, region, serviceName);
    } catch (e) {
      console.warn('  Note: could not get service URL/revision:', e.message);
    }
  }

  if (serviceUrl) {
    for (var hc = 1; hc <= 12; hc++) {
      await sleep(5000);
      try {
        var hcResult = await httpGet(serviceUrl + '/api/health');
        if (hcResult) {
          var parsed = JSON.parse(hcResult);
          if (parsed.status === 'ok' || parsed.mongo === 1) {
            healthy = true;
            console.log('✓ Health check passed (attempt ' + hc + '/' + '12)');
            console.log('  revision:', parsed.revision || 'unknown');
            if (parsed.revision) newRevision = parsed.revision;
            break;
          }
        }
      } catch (e) {
        console.log('  Health check attempt ' + hc + '/12: not ready yet...');
      }
    }
  }

  // Build rollback command
  var rollbackCmd = '';
  if (previousRevision) {
    rollbackCmd = 'gcloud run services update-traffic ' + serviceName
      + ' --region=' + region
      + ' --to-revisions ' + previousRevision + '=100';
  }

  // 9. Update deployment record
  var updateFields = {
    status: healthy ? 'running' : 'deployed_unhealthy',
    cloudRunUrl: serviceUrl || '',
    latestRevision: newRevision || '',
    previousRevision: previousRevision || '',
    rollbackCommand: rollbackCmd,
    buildId: buildId,
    deployedAt: new Date(),
    lastHealthCheck: new Date(),
    lastHealthStatus: healthy ? 'healthy' : 'unhealthy',
    updatedAt: new Date(),
  };

  // Push to versions history
  var versionEntry = {
    version: newRevision || '',
    imageTag: buildResult.imageTag || '',
    gitCommit: '',
    buildId: buildId,
    deployedAt: new Date(),
    status: healthy ? 'success' : 'deploying',
    revisionName: newRevision || '',
  };

  await Deployment.findByIdAndUpdate(dep._id, {
    $set: updateFields,
    $push: { versions: versionEntry }
  });

  console.log('✓ Deployment record updated');

  // ─── Summary ────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('DEPLOYMENT RESULT');
  console.log('========================================');
  console.log('Store:         ' + storeName);
  console.log('Service:       ' + serviceName);
  console.log('Region:        ' + region);
  console.log('URL:           ' + (serviceUrl || '(unknown)'));
  console.log('Previous rev:  ' + (previousRevision || '(none)'));
  console.log('New revision:  ' + (newRevision || '(unknown)'));
  console.log('Health check:  ' + (healthy ? 'PASS' : 'FAIL'));
  console.log('Status:        ' + (healthy ? 'RUNNING' : 'UNHEALTHY'));

  if (rollbackCmd) {
    console.log('\nRollback command:');
    console.log('  ' + rollbackCmd);
  }

  await mongoose.disconnect();
  process.exit(healthy ? 0 : 1);
}

// ─── Simple HTTP GET ─────────────────────────────────────────────────

function httpGet(targetUrl) {
  return new Promise(function(resolve, reject) {
    var parsed = url.parse(targetUrl);
    var opts = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.path,
      method: 'GET',
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    };

    var req = https.request(opts, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error('HTTP ' + res.statusCode));
      });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

main(process.argv[2]).catch(function(e) {
  console.error('FATAL:', e.message);
  process.exit(1);
});
