/**
 * T21c — Google Cloud Secret Manager wrapper for customer MongoDB URI.
 * DRY_RUN mode: no GCP calls, returns mock references (safe for dev/test).
 * Production mode: calls Secret Manager API.
 *
 * Security rules:
 * - Never log full URI
 * - Never return full URI in API responses
 * - Never pin to "latest" version for production (only pinned versions)
 * - One secret per customer deployment, one service account per secret
 */

const LOG_PREFIX = '[SecretManager]';

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(LOG_PREFIX, ...args);
}

function isDryRun() {
  return process.env.DRY_RUN === 'true' || process.env.SECRET_MANAGER_DRY_RUN === 'true';
}

/**
 * Build deterministic secret name for a store deployment.
 * Format: storeflow-mongo-{sanitized-name}
 * @param {string} storeName
 * @returns {string}
 */
function buildSecretName(storeName) {
  var prefix = 'storeflow-mongo-';
  var maxNameLen = 63 - prefix.length;
  var safe = storeName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxNameLen);
  return prefix + safe;
}

/**
 * Store MongoDB URI in Secret Manager.
 * @param {string} secretName - Short secret name (not full resource path)
 * @param {string} payload - MongoDB URI
 * @param {string} projectId - GCP project ID
 * @returns {Promise<{name: string, version: string, resourceName: string, storageMode: string, dryRun: boolean}>}
 */
async function storeMongoUri(secretName, payload, projectId) {
  if (isDryRun()) {
    log('DRY RUN: store secret "' + secretName + '" in project "' + projectId + '" (' + payload.length + ' chars)');
    return {
      name: secretName,
      version: 'dry-run-1',
      resourceName: 'projects/' + projectId + '/secrets/' + secretName + '/versions/dry-run-1',
      storageMode: 'secret_manager',
      dryRun: true
    };
  }

  const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();
  const parent = 'projects/' + projectId;
  const fullName = 'projects/' + projectId + '/secrets/' + secretName;
  const buf = Buffer.from(payload, 'utf8');

  let secret;
  try {
    [secret] = await client.getSecret({ name: fullName });
  } catch (e) {
    [secret] = await client.createSecret({
      parent,
      secretId: secretName,
      secret: {
        replication: { automatic: {} },
        labels: { app: 'storeflow', managed_by: 'storeflow-saas', scope: 'customer_mongo_uri' }
      }
    });
    log('Created secret "' + fullName + '"');
  }

  const [version] = await client.addSecretVersion({ parent: fullName, payload: { data: buf } });
  const versionId = version.name.split('/').pop();
  log('Added version "' + version.name + '"');

  return {
    name: secretName,
    version: versionId,
    resourceName: version.name,
    storageMode: 'secret_manager',
    dryRun: false
  };
}

/**
 * Retrieve MongoDB URI from Secret Manager.
 * @param {string} secretName
 * @param {string} version - Pinned version ID (never "latest" for prod)
 * @param {string} projectId
 * @returns {Promise<string|null>}
 */
async function retrieveMongoUri(secretName, version, projectId) {
  if (isDryRun()) {
    log('DRY RUN: retrieve "' + secretName + '" version "' + version + '"');
    return null;
  }

  if (version === 'latest') {
    warn('WARNING: Using "latest" version for "' + secretName + '" — pin to a specific version for production');
  }

  const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();
  const name = 'projects/' + projectId + '/secrets/' + secretName + '/versions/' + version;
  const [accessResponse] = await client.accessSecretVersion({ name });
  return accessResponse.payload.data.toString('utf8');
}

/**
 * Add a new version to an existing secret (when URI changes).
 * @param {string} secretName
 * @param {string} newPayload - New MongoDB URI
 * @param {string} projectId
 * @returns {Promise<{name: string, version: string, resourceName: string, storageMode: string, dryRun: boolean}>}
 */
async function updateMongoUri(secretName, newPayload, projectId) {
  if (isDryRun()) {
    log('DRY RUN: update "' + secretName + '" with new value (' + newPayload.length + ' chars)');
    return {
      name: secretName,
      version: 'dry-run-2',
      resourceName: 'projects/' + projectId + '/secrets/' + secretName + '/versions/dry-run-2',
      storageMode: 'secret_manager',
      dryRun: true
    };
  }

  const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();
  const parent = 'projects/' + projectId + '/secrets/' + secretName;
  const [version] = await client.addSecretVersion({
    parent,
    payload: { data: Buffer.from(newPayload, 'utf8') }
  });

  const versionId = version.name.split('/').pop();
  log('Updated secret — new version "' + version.name + '"');

  return {
    name: secretName,
    version: versionId,
    resourceName: version.name,
    storageMode: 'secret_manager',
    dryRun: false
  };
}

module.exports = {
  isDryRun,
  buildSecretName,
  storeMongoUri,
  retrieveMongoUri,
  updateMongoUri
};
