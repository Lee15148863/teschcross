/**
 * gcp-admin.js — GCP Cloud Run / Cloud Build utilities.
 * Used by deployments API for deploy lifecycle.
 * Stub: real operations require google-auth-library + GCP project access.
 */
let google;
try {
  google = require('google-auth-library');
} catch (e) {
  google = null;
}

async function triggerDeployBuild(projectId, region, serviceName, storeName, mongoUri, env, gitCommit) {
  if (!google) {
    return { buildId: 'stub-' + Date.now(), imageTag: serviceName + ':stub' };
  }
  // Real implementation would call Cloud Build API
  throw new Error('GCP deploy not implemented in stub');
}

async function getBuildStatus(projectId, buildId) {
  return { status: 'SUCCESS' };
}

async function getServiceUrl(projectId, region, serviceName) {
  return 'https://' + serviceName + '-abcdef-ue.a.run.app';
}

async function getLatestReadyRevision(projectId, region, serviceName) {
  return serviceName + '-00001-abcd';
}

async function updateCloudRunService(projectId, region, serviceName, path, patchBody) {
  return {};
}

async function updateServiceEnv(projectId, region, serviceName, envVars) {
  return {};
}

async function switchTraffic(projectId, region, serviceName, revisionName, percent) {
  return {};
}

async function getCloudRunService(projectId, region, serviceName) {
  return { status: { url: 'https://' + serviceName + '-abcdef-ue.a.run.app' } };
}

module.exports = {
  triggerDeployBuild,
  getBuildStatus,
  getServiceUrl,
  getLatestReadyRevision,
  updateCloudRunService,
  updateServiceEnv,
  switchTraffic,
  getCloudRunService
};
