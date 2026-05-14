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

  // Sanitize env var values for shell safety
  function sanitizeEnvVal(val) {
    return String(val || '').replace(/[^a-zA-Z0-9_.\-:@/=]/g, '_');
  }

  // Build env vars string for gcloud run deploy --set-env-vars
  var envPairs = [];
  if (mongoUri) {
    envPairs.push('MONGO_URI=' + mongoUri);
    envPairs.push('DBCon=' + mongoUri);
  }
  if (storeName) envPairs.push('STORE_NAME=' + sanitizeEnvVal(storeName));
  if (env && typeof env === 'object') {
    Object.keys(env).forEach(function(k) {
      if (k === 'DBCon' || k === 'MONGO_URI' || k === 'PORT') return; // set above or system-reserved
      envPairs.push(k + '=' + sanitizeEnvVal(String(env[k])));
    });
  }
  var envStr = envPairs.join(',');

  // Use gcloud run deploy --source . via child_process
  // This handles source upload, Cloud Build, and Cloud Run deploy in one command
  var deployCmd = 'gcloud run deploy ' + serviceName
    + ' --source .'
    + ' --region=' + region
    + ' --allow-unauthenticated'
    + ' --concurrency=80'
    + ' --timeout=300'
    + ' --labels=app=storeflow,store=' + (storeName || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_') + ',managed-by=storeflow-saas'
    + ' --set-env-vars=' + envStr
    + ' --project=' + projectId;

  log('running gcloud deploy for', serviceName);
  log('command: gcloud run deploy ' + serviceName + ' --source . --region=' + region + ' [env vars hidden]');

  var exec = require('child_process').exec;
  var result = await new Promise(function(resolve, reject) {
    exec(deployCmd, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
      timeout: 600000
    }, function(err, stdout, stderr) {
      if (err) {
        log('gcloud deploy failed:', err.message);
        // Extract more detail from stderr
        var detail = stderr ? stderr.split('\n').slice(-5).join(' ').trim() : err.message;
        reject(new Error(detail));
      } else {
        // Parse revision name from output: "revision [xxx-abc] has been deployed"
        var revMatch = stdout.match(/revision\s+\[([^\]]+)\]/);
        var revName = revMatch ? revMatch[1] : '';
        var urlMatch = stdout.match(/Service URL:\s+(\S+)/);
        var url = urlMatch ? urlMatch[1] : '';

        log('deploy succeeded for', serviceName, 'rev:', revName);
        resolve({
          revisionName: revName,
          serviceUrl: url,
          rawOutput: stdout.slice(-2000)
        });
      }
    });
  });

  return {
    buildId: 'gcloud-' + Date.now(),
    imageTag: serviceName + ':latest',
    revisionName: result.revisionName,
    serviceUrl: result.serviceUrl,
    rawOutput: result.rawOutput
  };
}

// ─── F2: getBuildStatus ──────────────────────────────────────────────

async function getBuildStatus(projectId, buildId) {
  if (isDryRun()) {
    return { status: 'SUCCESS' };
  }

  // If buildId starts with 'operations/', use the operations API
  var buildUrl;
  if (buildId && buildId.indexOf('operations/') === 0) {
    buildUrl = 'https://cloudbuild.googleapis.com/v1/' + buildId;
  } else {
    buildUrl = 'https://cloudbuild.googleapis.com/v1/projects/' + projectId + '/builds/' + encodeURIComponent(buildId);
  }

  try {
    var result = await withRetry(function() {
      return gcpRequest('GET', buildUrl);
    }, 2, 1000);

    // If using operations API, check if operation is done
    if (buildId && buildId.indexOf('operations/') === 0) {
      if (result.done && result.response) {
        var build = result.response;
        return {
          status: build.status || 'UNKNOWN',
          failureInfo: build.failureInfo || null
        };
      }
      if (result.done && result.error) {
        return { status: 'FAILURE', failureInfo: { detail: result.error.message } };
      }
      return { status: 'WORKING', failureInfo: null };
    }

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

  var exec = require('child_process').exec;
  var cmd = 'gcloud run services update-traffic ' + serviceName
    + ' --region=' + region
    + ' --to-revisions ' + revisionName + '=' + percent
    + ' --project=' + projectId;

  log('switching traffic:', serviceName, revisionName, percent + '%');

  var result = await new Promise(function(resolve, reject) {
    exec(cmd, { timeout: 60000 }, function(err, stdout, stderr) {
      if (err) {
        var detail = stderr ? stderr.split('\n').slice(-3).join(' ').trim() : err.message;
        reject(new Error(detail));
      } else {
        resolve({ updated: true, rawOutput: stdout.slice(-1000) });
      }
    });
  });

  return result;
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
  assertNotMainPos(serviceName);

  if (isDryRun()) {
    log('[DRY-RUN] updateServiceEnv', serviceName, Object.keys(envVars || {}).length, 'vars');
    return { updated: true, dryRun: true };
  }

  if (!envVars || typeof envVars !== 'object' || Object.keys(envVars).length === 0) {
    throw new Error('envVars must be a non-empty object');
  }

  // Build --update-env-vars string
  var envPairs = [];
  Object.keys(envVars).forEach(function(k) {
    var v = envVars[k];
    if (v === null || v === undefined) {
      envPairs.push(k + '-'); // Remove env var
    } else {
      envPairs.push(k + '=' + String(v));
    }
  });

  var exec = require('child_process').exec;
  var cmd = 'gcloud run services update ' + serviceName
    + ' --region=' + region
    + ' --update-env-vars=' + envPairs.join(',')
    + ' --project=' + projectId;

  log('updating env vars for', serviceName, '(' + envPairs.length + ' vars)');

  var result = await new Promise(function(resolve, reject) {
    exec(cmd, { timeout: 60000 }, function(err, stdout, stderr) {
      if (err) {
        var detail = stderr ? stderr.split('\n').slice(-3).join(' ').trim() : err.message;
        reject(new Error(detail));
      } else {
        resolve({ updated: true, rawOutput: stdout.slice(-1000) });
      }
    });
  });

  return result;
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

module.exports = {
  triggerDeployBuild,
  getBuildStatus,
  getServiceUrl,
  getLatestReadyRevision,
  switchTraffic,
  updateCloudRunService,
  updateServiceEnv,
  getCloudRunService
};
