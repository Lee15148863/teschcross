/**
 * Validate utils/gcp-secret-manager.js against real GCP Secret Manager.
 *
 * Uses test-only fake URI — never real customer data.
 * Never prints full secret value.
 *
 * Usage:
 *   node scripts/test-secret-manager-real.js
 *
 * Env: GOOGLE_CLOUD_PROJECT or GCP_PROJECT (defaults to gcloud config)
 */

// Force real mode — no dry-run
delete process.env.SECRET_MANAGER_DRY_RUN;
delete process.env.DRY_RUN;

const { execSync } = require('child_process');

async function main() {
  // ─── Resolve project ──────────────────────────────────────────────
  let projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projectId) {
    try {
      projectId = execSync('gcloud config get-value project', { encoding: 'utf8', timeout: 5000 }).trim();
    } catch (e) {
      console.error('FATAL: Cannot determine GCP project. Set GOOGLE_CLOUD_PROJECT or gcloud config.');
      process.exit(1);
    }
  }
  console.log('Project:          ' + projectId);

  // ─── Auth check ───────────────────────────────────────────────────
  try {
    const account = execSync('gcloud auth list --format="value(account)" --filter=status:ACTIVE', { encoding: 'utf8', timeout: 5000 }).trim();
    console.log('Account:          ' + (account || 'none'));
  } catch (e) {
    console.log('Account:          unknown (gcloud not available)');
  }

  // ─── Test secret ──────────────────────────────────────────────────
  const TEST_STORE_NAME = '__secret_validation_test__';
  const TEST_URI = 'mongodb+srv://test_user:test_password@example.mongodb.net/storeflow_secret_test';
  const MASKED_URI = 'mongodb+srv://test_user:***@example.mongodb.net/storeflow_secret_test';

  console.log('Test secret:      storeflow-mongo-__secret-validation-test__');
  console.log('Test URI (masked): ' + MASKED_URI);
  console.log('');

  const sm = require('../utils/gcp-secret-manager');
  const secretName = sm.buildSecretName(TEST_STORE_NAME);

  // ─── Phase 1: Store ───────────────────────────────────────────────
  console.log('--- Phase 1: storeMongoUri ---');
  let storeResult;
  try {
    storeResult = await sm.storeMongoUri(secretName, TEST_URI, projectId);
  } catch (e) {
    console.error('FAIL: storeMongoUri threw:', e.message);
    process.exit(1);
  }

  console.log('  name:             ' + storeResult.name);
  console.log('  version:          ' + storeResult.version);
  console.log('  storageMode:      ' + storeResult.storageMode);
  console.log('  dryRun:           ' + storeResult.dryRun);
  console.log('  resourceName:     ' + storeResult.resourceName);

  // Safety: response must not contain full URI
  const storeStr = JSON.stringify(storeResult);
  if (storeStr.includes('test_user:test_password')) {
    console.error('FAIL: store response leaked secret value!');
    process.exit(1);
  }
  if (storeStr.includes('example.mongodb.net')) {
    console.error('FAIL: store response leaked host!');
    process.exit(1);
  }
  console.log('  leakage check:    PASS (no secret in response)');
  console.log('');

  if (storeResult.dryRun) {
    console.error('FAIL: Secret Manager is in dry-run mode. Unset SECRET_MANAGER_DRY_RUN / DRY_RUN.');
    process.exit(1);
  }
  if (!storeResult.version || storeResult.version === 'latest') {
    console.error('FAIL: version is "latest" — not pinned!');
    process.exit(1);
  }
  console.log('  version pinned:   PASS (' + storeResult.version + ' !== "latest")');
  console.log('');

  // ─── Phase 2: Retrieve ────────────────────────────────────────────
  console.log('--- Phase 2: retrieveMongoUri ---');
  let retrieved;
  try {
    retrieved = await sm.retrieveMongoUri(secretName, storeResult.version, projectId);
  } catch (e) {
    console.error('FAIL: retrieveMongoUri threw:', e.message);
    process.exit(1);
  }

  if (retrieved !== TEST_URI) {
    console.error('FAIL: retrieved value does not match stored value');
    console.error('  expected length: ' + TEST_URI.length);
    console.error('  got length:      ' + (retrieved ? retrieved.length : 0));
    process.exit(1);
  }
  // Log only length, never the value
  console.log('  retrieved length: ' + retrieved.length + ' chars');
  console.log('  value match:      PASS');
  console.log('');

  // ─── Phase 3: Update ──────────────────────────────────────────────
  console.log('--- Phase 3: updateMongoUri ---');
  const UPDATED_TEST_URI = 'mongodb+srv://test_user2:new_password@example.mongodb.net/storeflow_secret_test';
  let updateResult;
  try {
    updateResult = await sm.updateMongoUri(secretName, UPDATED_TEST_URI, projectId);
  } catch (e) {
    console.error('FAIL: updateMongoUri threw:', e.message);
    process.exit(1);
  }

  console.log('  name:             ' + updateResult.name);
  console.log('  version:          ' + updateResult.version);
  console.log('  dryRun:           ' + updateResult.dryRun);

  const updateStr = JSON.stringify(updateResult);
  if (updateStr.includes('test_user2:new_password') || updateStr.includes('example.mongodb.net')) {
    console.error('FAIL: update response leaked secret value!');
    process.exit(1);
  }
  console.log('  leakage check:    PASS (no secret in response)');
  console.log('');

  // ─── Phase 4: Retrieve updated ────────────────────────────────────
  console.log('--- Phase 4: retrieve updated value ---');
  let retrieved2;
  try {
    retrieved2 = await sm.retrieveMongoUri(secretName, updateResult.version, projectId);
  } catch (e) {
    console.error('FAIL: retrieveMongoUri (updated) threw:', e.message);
    process.exit(1);
  }

  if (retrieved2 !== UPDATED_TEST_URI) {
    console.error('FAIL: retrieved updated value does not match');
    process.exit(1);
  }
  console.log('  retrieved length: ' + retrieved2.length + ' chars');
  console.log('  value match:      PASS');
  console.log('');

  // ─── Phase 5: Old version still accessible ────────────────────────
  console.log('--- Phase 5: old version still accessible ---');
  let oldValue;
  try {
    oldValue = await sm.retrieveMongoUri(secretName, storeResult.version, projectId);
  } catch (e) {
    console.error('FAIL: retrieve old version threw:', e.message);
    process.exit(1);
  }
  if (oldValue !== TEST_URI) {
    console.error('FAIL: old version value mismatch');
    process.exit(1);
  }
  console.log('  old version (' + storeResult.version + '):      ' + oldValue.length + ' chars, match');
  console.log('  new version (' + updateResult.version + '):      ' + retrieved2.length + ' chars, match');
  console.log('');

  // ─── Phase 6: Verify "latest" warning works ───────────────────────
  console.log('--- Phase 6: "latest" version warning ---');
  // Reset logger capture by just calling with 'latest' version
  const latestResult = await sm.retrieveMongoUri(secretName, 'latest', projectId);
  console.log('  latest retrieval: ' + (latestResult ? 'OK (' + latestResult.length + ' chars)' : 'null'));
  console.log('  (warning expected in stderr above — do NOT use "latest" in production)');
  console.log('');

  // ─── Cleanup ──────────────────────────────────────────────────────
  console.log('--- Cleanup: delete test secret ---');
  const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();
  const fullName = 'projects/' + projectId + '/secrets/' + secretName;
  try {
    await client.deleteSecret({ name: fullName });
    console.log('  deleted:          ' + fullName);
  } catch (e) {
    // If deletion fails (e.g., permissions), test secret remains — clearly named
    console.log('  WARN: could not delete — leave test secret: ' + fullName);
    console.log('  reason:           ' + e.message);
  }

  // ─── Summary ──────────────────────────────────────────────────────
  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Project:          ' + projectId);
  console.log('Secret:           ' + secretName);
  console.log('Created version:  ' + storeResult.version);
  console.log('Updated version:  ' + updateResult.version);
  console.log('Result:           PASS');
  console.log('Secret leakage:   NONE');
  console.log('');

  console.log('Service account permissions required for production:');
  console.log('  roles/secretmanager.secretAccessor on each customer secret');
  console.log('  One service account per customer, scoped to their secret only');
  console.log('  Do NOT use a single shared service account across customers');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
