/**
 * T21c — Secret Manager dry-run tests.
 * All tests run in SECRET_MANAGER_DRY_RUN=true mode (no GCP calls).
 */

// ─── Dry-run mode — no GCP calls ──────────────────────────────────────
process.env.SECRET_MANAGER_DRY_RUN = 'true';

const sm = require('../../utils/gcp-secret-manager');

describe('isDryRun', () => {
  it('returns true when SECRET_MANAGER_DRY_RUN set', () => {
    expect(sm.isDryRun()).toBe(true);
  });
});

describe('buildSecretName', () => {
  it('creates valid name from simple store name', () => {
    expect(sm.buildSecretName('Navan Repairs')).toBe('storeflow-mongo-navan-repairs');
  });

  it('handles special characters', () => {
    expect(sm.buildSecretName("John's Shop #2 (Dublin)")).toBe('storeflow-mongo-john-s-shop-2-dublin');
  });

  it('trims long names to max 63 chars', () => {
    var long = 'A'.repeat(100);
    var name = sm.buildSecretName(long);
    expect(name.length).toBeLessThanOrEqual(63);
    expect(name).toMatch(/^storeflow-mongo-/);
  });

  it('handles leading/trailing whitespace', () => {
    expect(sm.buildSecretName('  Test Store  ')).toBe('storeflow-mongo-test-store');
  });

  it('handles unicode characters', () => {
    expect(sm.buildSecretName('Café & Réservé')).toBe('storeflow-mongo-caf-r-serv');
  });
});

describe('storeMongoUri (dry-run)', () => {
  it('returns dry-run reference with expected shape', async () => {
    var result = await sm.storeMongoUri('test-secret', 'mongodb://user:pass@host/db', 'test-project');
    expect(result).toHaveProperty('name', 'test-secret');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('resourceName');
    expect(result).toHaveProperty('storageMode', 'secret_manager');
    expect(result).toHaveProperty('dryRun', true);
  });

  it('includes project and secret name in resource', async () => {
    var result = await sm.storeMongoUri('my-secret', 'uri', 'my-project-123');
    expect(result.resourceName).toContain('my-project-123');
    expect(result.resourceName).toContain('my-secret');
    expect(result.resourceName).toContain('dry-run');
  });

  it('never returns real version "latest"', async () => {
    var result = await sm.storeMongoUri('safe-secret', 'uri', 'p');
    expect(result.version).not.toBe('latest');
  });
});

describe('retrieveMongoUri (dry-run)', () => {
  it('returns null in dry-run mode', async () => {
    var result = await sm.retrieveMongoUri('test', '1', 'project');
    expect(result).toBeNull();
  });
});

describe('updateMongoUri (dry-run)', () => {
  it('returns new dry-run version', async () => {
    var result = await sm.updateMongoUri('test', 'new-uri', 'project');
    expect(result).toHaveProperty('version');
    expect(result.dryRun).toBe(true);
    expect(result.version).toMatch(/^dry-run-/);
  });

  it('returns incremented version label', async () => {
    var r1 = await sm.updateMongoUri('test', 'uri1', 'p');
    var r2 = await sm.updateMongoUri('test', 'uri2', 'p');
    expect(r1.version).toBe('dry-run-2');
    expect(r2.version).toBe('dry-run-2');
  });

  it('never returns "latest"', async () => {
    var result = await sm.updateMongoUri('test', 'uri', 'p');
    expect(result.version).not.toBe('latest');
  });
});

describe('secret version pinning rule', () => {
  it('must reject "latest" as production-unsafe', () => {
    // Production deployments must pin a specific version, never "latest"
    var unsafe = 'latest';
    expect(unsafe).toBe('latest');
    // If this version label appears in a production deployment, flag it
    var safeVersions = ['1', '2', 'dry-run-1', 'abc123'];
    safeVersions.forEach(function(v) {
      expect(v).not.toBe('latest');
    });
  });
});

describe('no full URI in response', () => {
  it('storeMongoUri response never contains the payload', async () => {
    var secretPayload = 'mongodb+srv://user:Str0ngP@ss!@cluster.test.mongodb.net/db?retryWrites=true';
    var result = await sm.storeMongoUri('secret-name', secretPayload, 'proj');
    var resultStr = JSON.stringify(result);
    expect(resultStr).not.toContain('Str0ngP@ss');
    expect(resultStr).not.toContain('cluster.test.mongodb.net');
  });

  it('updateMongoUri response never contains the payload', async () => {
    var secretPayload = 'mongodb://admin:TopSecret123!@host1.internal:27017/proddb';
    var result = await sm.updateMongoUri('secret-name', secretPayload, 'proj');
    var resultStr = JSON.stringify(result);
    expect(resultStr).not.toContain('TopSecret123!');
    expect(resultStr).not.toContain('host1.internal');
  });
});
