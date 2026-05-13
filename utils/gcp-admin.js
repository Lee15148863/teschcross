/**
 * gcp-admin.js — GCP Cloud Run / Cloud Build utilities.
 * Slice 1: triggerDeployBuild, getBuildStatus, getServiceUrl,
 *          getLatestReadyRevision, switchTraffic.
 *
 * Dry-run: GCP_ADMIN_DRY_RUN=true (or DRY_RUN=true) — no API calls.
 * Auth: google-auth-library (ADC or service account key).
 *
 * Safety:
 * - Service names starting with "teschcross" are BLOCKED (Main POS).
 * - Never log mongoUri, secrets, or customer data.
 * - Dry-run mode returns mock responses for local testing.
 */
const https = require('https');
const url = require('url');

var google = null;
try {
  google = require('google-auth-library');
} catch (e) { /* keep null */ }

var LOG_PREFIX = '[gcp-admin]';

function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(LOG_PREFIX);
  console.log.apply(console, args);
}

function warn() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(LOG_PREFIX);
  console.warn.apply(console, args);
}

function isDryRun() {
  return process.env.GCP_ADMIN_DRY_RUN === 'true' || process.env.DRY_RUN === 'true';
}

// ─── Safety: block Main POS services ────────────────────────────────
var BLOCKED_SERVICE_PREFIXES = ['teschcross', 'main-pos', 'techcross-'];

function assertNotMainPos(serviceName) {
  for (var i = 0; i < BLOCKED_SERVICE_PREFIXES.length; i++) {
    if (serviceName.indexOf(BLOCKED_SERVICE_PREFIXES[i]) === 0) {
      throw new Error('BLOCKED: service name "' + serviceName + '" matches Main POS prefix "' + BLOCKED_SERVICE_PREFIXES[i] + '". This operation is not allowed.');
    }
  }
}

// ─── Auth helpers ────────────────────────────────────────────────────

var authClient = null;

async function getAuthToken() {
  if (!google) throw new Error('google-auth-library not available');
  if (!authClient) {
    authClient = new google.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  var client = await authClient.getClient();
  var token = await client.getAccessToken();
  return token.token || token.accessToken;
}

// ─── HTTP helper ─────────────────────────────────────────────────────

function gcpRequest(method, requestUrl, body) {
  return new Promise(function(resolve, reject) {
    getAuthToken().then(function(token) {
      var parsed = url.parse(requestUrl);
      var opts = {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.path,
        method: method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      var bodyStr = body ? JSON.stringify(body) : '';
      if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);

      var req = https.request(opts, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            var errMsg = 'HTTP ' + res.statusCode;
            try {
              var parsed = JSON.parse(data);
              if (parsed.error && parsed.error.message) errMsg += ': ' + parsed.error.message;
            } catch (e) { /* use default */ }
            reject(new Error(errMsg));
          } else {
            try { resolve(JSON.parse(data)); }
            catch (e) { resolve(data); }
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(30000, function() { req.destroy(new Error('Request timeout')); });
      if (bodyStr) req.write(bodyStr);
      req.end();
    }).catch(reject);
  });
}

// ─── Retry helper ────────────────────────────────────────────────────

async function withRetry(fn, maxRetries, baseDelay) {
  maxRetries = maxRetries || 2;
  baseDelay = baseDelay || 1000;
  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxRetries) throw e;
      var delay = baseDelay * Math.pow(2, attempt);
      log('retry', (attempt + 1), 'of', maxRetries, 'after', delay + 'ms:', e.message);
      await new Promise(function(r) { setTimeout(r, delay); });
    }
  }
}

// ─── F1: triggerDeployBuild ──────────────────────────────────────────

async function triggerDeployBuild(projectId, region, serviceName, storeName, mongoUri, env, gitCommit) {
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    log('[DRY-RUN] triggerDeployBuild', serviceName, 'region', region);
    return { buildId: 'dry-run-' + Date.now(), imageTag: serviceName + ':dry-run' };
  }

  if (!google) throw new Error('google-auth-library not available. Cannot trigger real build.');

  var imageTag = region + '-docker.pkg.dev/' + projectId + '/storeflow/' + serviceName + ':' + (gitCommit || 'latest');

  // Build env vars string for gcloud run deploy --set-env-vars
  var envPairs = [];
  if (mongoUri) envPairs.push('MONGO_URI=' + mongoUri);
  if (storeName) envPairs.push('STORE_NAME=' + storeName);
  if (env && typeof env === 'object') {
    Object.keys(env).forEach(function(k) {
      envPairs.push(k + '=' + String(env[k]));
    });
  }
  var envStr = envPairs.join(',');

  var buildSteps = [
    {
      name: 'gcr.io/cloud-builders/docker',
      args: ['build', '-t', imageTag, '.']
    },
    {
      name: 'gcr.io/cloud-builders/docker',
      args: ['push', imageTag]
    },
    {
      name: 'gcr.io/google.com/cloudsdktool/cloud-sdk',
      entrypoint: 'gcloud',
      args: [
        'run', 'deploy', serviceName,
        '--image=' + imageTag,
        '--region=' + region,
        '--platform=managed',
        '--allow-unauthenticated',
        '--concurrency=80',
        '--timeout=300',
        '--labels=app=storeflow,store=' + (storeName || '').replace(/[^a-zA-Z0-9_-]/g, '_') + ',managed-by=storeflow-saas',
        '--set-env-vars=' + envStr,
        '--service-account=' + serviceName + '@' + projectId + '.iam.gserviceaccount.com'
      ]
    }
  ];

  var buildBody = {
    steps: buildSteps,
    timeout: '600s',
    options: {
      machineType: 'E2_HIGHCPU_8',
      logging: 'CLOUD_LOGGING_ONLY'
    },
    tags: ['storeflow', 'saas-deploy', serviceName]
  };

  var buildUrl = 'https://cloudbuild.googleapis.com/v1/projects/' + projectId + '/builds';

  log('submitting build for', serviceName);

  var result;
  try {
    result = await withRetry(function() {
      return gcpRequest('POST', buildUrl, buildBody);
    }, 1, 2000);
  } catch (e) {
    log('build trigger failed:', e.message);
    throw e;
  }

  log('build submitted:', result.id, 'for', serviceName);

  return {
    buildId: result.id || result.name,
    imageTag: imageTag
  };
}

// ─── F2: getBuildStatus ──────────────────────────────────────────────

async function getBuildStatus(projectId, buildId) {
  if (isDryRun()) {
    return { status: 'SUCCESS' };
  }

  var buildUrl = 'https://cloudbuild.googleapis.com/v1/projects/' + projectId + '/builds/' + encodeURIComponent(buildId);

  try {
    var result = await withRetry(function() {
      return gcpRequest('GET', buildUrl);
    }, 2, 1000);

    return {
      status: result.status || 'UNKNOWN',
      failureInfo: result.failureInfo || null
    };
  } catch (e) {
    log('getBuildStatus failed:', e.message);
    return { status: 'UNKNOWN', failureInfo: { detail: e.message } };
  }
}

// ─── F3: getServiceUrl ───────────────────────────────────────────────

async function getServiceUrl(projectId, region, serviceName) {
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    return 'https://' + serviceName + '-dry-run.a.run.app';
  }

  var svcUrl = 'https://run.googleapis.com/v1/projects/' + projectId + '/locations/' + region + '/services/' + serviceName;

  try {
    var result = await withRetry(function() {
      return gcpRequest('GET', svcUrl);
    }, 2, 1000);

    return (result.status && result.status.url) || '';
  } catch (e) {
    log('getServiceUrl failed:', e.message);
    return '';
  }
}

// ─── F4: getLatestReadyRevision ──────────────────────────────────────

async function getLatestReadyRevision(projectId, region, serviceName) {
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    return serviceName + '-dry-run-revision';
  }

  var svcUrl = 'https://run.googleapis.com/v1/projects/' + projectId + '/locations/' + region + '/services/' + serviceName;

  try {
    var result = await withRetry(function() {
      return gcpRequest('GET', svcUrl);
    }, 2, 1000);

    // Try latestReadyRevisionName first
    if (result.status && result.status.latestReadyRevisionName) {
      var parts = result.status.latestReadyRevisionName.split('/');
      return parts[parts.length - 1];
    }

    // Fallback: parse status.traffic for latest revision
    if (result.status && result.status.traffic) {
      for (var i = 0; i < result.status.traffic.length; i++) {
        var entry = result.status.traffic[i];
        if (entry.latestRevision && entry.revisionName) {
          var revParts = entry.revisionName.split('/');
          return revParts[revParts.length - 1];
        }
      }
      // Return first revision with traffic
      if (result.status.traffic.length > 0 && result.status.traffic[0].revisionName) {
        var revParts = result.status.traffic[0].revisionName.split('/');
        return revParts[revParts.length - 1];
      }
    }

    return '';
  } catch (e) {
    log('getLatestReadyRevision failed:', e.message);
    return '';
  }
}

// ─── F5: switchTraffic ───────────────────────────────────────────────

async function switchTraffic(projectId, region, serviceName, revisionName, percent) {
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    log('[DRY-RUN] switchTraffic', serviceName, revisionName, percent + '%');
    return {};
  }

  percent = percent || 100;
  if (percent < 0 || percent > 100) {
    throw new Error('Percent must be 0-100, got ' + percent);
  }

  var svcUrl = 'https://run.googleapis.com/v1/projects/' + projectId + '/locations/' + region + '/services/' + serviceName;

  var patchBody = {
    spec: {
      traffic: [
        { revisionName: revisionName, percent: percent },
        { latestReadyRevision: true, percent: 100 - percent }
      ]
    }
  };

  log('switching traffic:', serviceName, revisionName, percent + '%');

  try {
    var result = await withRetry(function() {
      return gcpRequest('PATCH', svcUrl + '?updateMask=spec.traffic', patchBody);
    }, 1, 2000);
    return result;
  } catch (e) {
    log('switchTraffic failed:', e.message);
    throw e;
  }
}

// ─── Existing stubs (carried over, not yet implemented) ──────────────

async function updateCloudRunService(projectId, region, serviceName, path, patchBody) {
  if (isDryRun()) {
    log('[DRY-RUN] updateCloudRunService', serviceName);
    return {};
  }
  // Not yet implemented
  log('updateCloudRunService not implemented');
  return {};
}

async function updateServiceEnv(projectId, region, serviceName, envVars) {
  if (isDryRun()) {
    log('[DRY-RUN] updateServiceEnv', serviceName);
    return {};
  }
  // Not yet implemented
  log('updateServiceEnv not implemented');
  return {};
}

async function getCloudRunService(projectId, region, serviceName) {
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    return { status: { url: 'https://' + serviceName + '-dry-run.a.run.app' } };
  }

  var svcUrl = 'https://run.googleapis.com/v1/projects/' + projectId + '/locations/' + region + '/services/' + serviceName;

  try {
    return await withRetry(function() {
      return gcpRequest('GET', svcUrl);
    }, 2, 1000);
  } catch (e) {
    log('getCloudRunService failed:', e.message);
    throw e;
  }
}

async function listRevisions(projectId, region, serviceName) {
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    return {
      revisions: [
        { name: serviceName + '/dry-run-revision', revisionName: serviceName + '-dry-run-revision', image: serviceName + ':dry-run', created: new Date().toISOString(), serving: true, status: 'Ready' }
      ]
    };
  }

  var revUrl = 'https://run.googleapis.com/v1/projects/' + projectId + '/locations/' + region + '/revisions?filter=metadata.annotations%5B%27serving.knative.dev%2Fservice%27%5D%3D' + encodeURIComponent(serviceName);

  try {
    var result = await withRetry(function() {
      return gcpRequest('GET', revUrl);
    }, 2, 1000);

    var items = result.items || [];
    return {
      revisions: items.map(function(r) {
        var parts = (r.metadata && r.metadata.name) ? r.metadata.name.split('/') : [];
        var status = 'Unknown';
        if (r.status && r.status.conditions) {
          for (var i = 0; i < r.status.conditions.length; i++) {
            if (r.status.conditions[i].type === 'Ready') {
              status = r.status.conditions[i].status === 'True' ? 'Ready' : (r.status.conditions[i].status === 'False' ? 'Failed' : 'Unknown');
              break;
            }
          }
        }
        return {
          name: r.metadata ? r.metadata.name : '',
          revisionName: parts[parts.length - 1] || '',
          image: (r.spec && r.spec.containers && r.spec.containers[0]) ? r.spec.containers[0].image : '',
          created: r.metadata ? r.metadata.creationTimestamp : '',
          serving: (r.status && r.status.servingStatus) === 'SERVING',
          status: status
        };
      })
    };
  } catch (e) {
    log('listRevisions failed:', e.message);
    throw e;
  }
}

module.exports = {
  triggerDeployBuild,
  getBuildStatus,
  getServiceUrl,
  getLatestReadyRevision,
  listRevisions,
  switchTraffic,
  updateCloudRunService,
  updateServiceEnv,
  getCloudRunService
};
