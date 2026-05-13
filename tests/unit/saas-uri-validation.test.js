const {
  maskMongoUri,
  parseMongoDbName,
  parseUriParts,
  validateMongoUriFormat,
  validateMongoUriConnection,
  validateMongoUri,
  setMongoClientOverride,
} = require('../../utils/mongo-uri-validator');

const VALID_URI = 'mongodb+srv://shopuser:Str0ngP@ss!@cluster0.abcd.mongodb.net/shopdb?retryWrites=true';
const MASKED = 'mongodb+srv://shopuser:***@cluster0.abcd.mongodb.net/shopdb?retryWrites=true';

// ─── maskMongoUri ─────────────────────────────────────────────────────

describe('maskMongoUri', () => {
  it('hides password in standard URI', () => {
    expect(maskMongoUri(VALID_URI)).toBe(MASKED);
  });

  it('hides password in mongodb:// URI with port', () => {
    const uri = 'mongodb://admin:s3cret@host1:27017/mydb';
    expect(maskMongoUri(uri)).toBe('mongodb://admin:***@host1:27017/mydb');
  });

  it('handles empty input', () => {
    expect(maskMongoUri('')).toBe('');
    expect(maskMongoUri(null)).toBe('');
    expect(maskMongoUri(undefined)).toBe('');
  });

  it('handles URI with special characters in password', () => {
    const uri = 'mongodb://user:p@ssw0rd!@host/db';
    expect(maskMongoUri(uri)).toContain(':***@');
    expect(maskMongoUri(uri)).not.toContain('p@ssw0rd!');
  });

  it('returns safe string for non-string input', () => {
    expect(maskMongoUri(123)).toBe('');
  });
});

// ─── parseMongoDbName ─────────────────────────────────────────────────

describe('parseMongoDbName', () => {
  it('extracts database name from mongodb+srv:// URI', () => {
    expect(parseMongoDbName(VALID_URI)).toBe('shopdb');
  });

  it('extracts database name from mongodb:// URI', () => {
    expect(parseMongoDbName('mongodb://u:p@host/mydb')).toBe('mydb');
  });

  it('returns null for URI without database', () => {
    expect(parseMongoDbName('mongodb://u:p@host')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseMongoDbName('')).toBeNull();
    expect(parseMongoDbName(null)).toBeNull();
  });
});

// ─── parseUriParts ────────────────────────────────────────────────────

describe('parseUriParts', () => {
  it('parses standard URI correctly', () => {
    const p = parseUriParts(VALID_URI);
    expect(p).not.toBeNull();
    expect(p.scheme).toBe('mongodb+srv');
    expect(p.username).toBe('shopuser');
    expect(p.password).toBe('Str0ngP@ss!');
    expect(p.dbName).toBe('shopdb');
    expect(p.hosts[0].hostname).toBe('cluster0.abcd.mongodb.net');
  });

  it('returns null for invalid scheme', () => {
    expect(parseUriParts('http://host/db')).toBeNull();
  });
});

// ─── validateMongoUriFormat ───────────────────────────────────────────

describe('validateMongoUriFormat', () => {
  const opts = {
    mainPosDbName: 'techcross',
    adminDbName: 'saas_admin',
    forbiddenDbNames: ['test', 'admin'],
  };

  it('rejects empty URI', () => {
    const r = validateMongoUriFormat('', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('EMPTY_URI');
  });

  it('rejects non-mongodb scheme', () => {
    const r = validateMongoUriFormat('http://host/db', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('INVALID_SCHEME');
  });

  it('rejects missing username', () => {
    const r = validateMongoUriFormat('mongodb://:pass@host/db', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('MISSING_USERNAME');
  });

  it('rejects missing password', () => {
    const r = validateMongoUriFormat('mongodb://user@host/db', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('MISSING_PASSWORD');
  });

  it('rejects missing database', () => {
    const r = validateMongoUriFormat('mongodb://user:pass@host', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('MISSING_DATABASE');
  });

  it('rejects localhost', () => {
    const r = validateMongoUriFormat('mongodb://u:p@localhost:27017/mydb', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('LOOPBACK_HOST');
  });

  it('rejects 127.0.0.1', () => {
    const r = validateMongoUriFormat('mongodb://u:p@127.0.0.1:27017/mydb', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('LOOPBACK_HOST');
  });

  it('rejects 0.0.0.0', () => {
    const r = validateMongoUriFormat('mongodb://u:p@0.0.0.0:27017/mydb', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('LOOPBACK_HOST');
  });

  it('rejects IPv6 ::1', () => {
    const r = validateMongoUriFormat('mongodb://u:p@[::1]:27017/mydb', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('LOOPBACK_HOST');
  });

  it('rejects 10.x.x.x private IP', () => {
    const r = validateMongoUriFormat('mongodb://u:p@10.0.0.5:27017/mydb', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('PRIVATE_IP');
  });

  it('rejects 192.168.x.x private IP', () => {
    const r = validateMongoUriFormat('mongodb://u:p@192.168.1.100:27017/mydb', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('PRIVATE_IP');
  });

  it('rejects 172.16-31.x.x private IP', () => {
    const r1 = validateMongoUriFormat('mongodb://u:p@172.16.0.1:27017/mydb', opts);
    expect(r1.ok).toBe(false);
    expect(r1.code).toBe('PRIVATE_IP');
    const r2 = validateMongoUriFormat('mongodb://u:p@172.31.255.255:27017/mydb', opts);
    expect(r2.ok).toBe(false);
    expect(r2.code).toBe('PRIVATE_IP');
  });

  it('rejects Main POS database name', () => {
    const r = validateMongoUriFormat('mongodb://u:p@host/techcross', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('MAIN_POS_DB');
  });

  it('rejects StoreFlow Admin database name', () => {
    const r = validateMongoUriFormat('mongodb://u:p@host/saas_admin', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('ADMIN_DB');
  });

  it('rejects saas_ prefixed database', () => {
    const r = validateMongoUriFormat('mongodb://u:p@host/saas_anything', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('RESERVED_DB_PREFIX');
  });

  it('rejects forbidden database name', () => {
    const r = validateMongoUriFormat('mongodb://u:p@host/admin', opts);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('FORBIDDEN_DB');
  });

  it('accepts valid format', () => {
    const r = validateMongoUriFormat(VALID_URI, opts);
    expect(r.ok).toBe(true);
    expect(r.code).toBe('VALID');
    expect(r.dbName).toBe('shopdb');
    expect(r.maskedUri).toBe(MASKED);
  });

  it('no password in result for rejected URI', () => {
    const r = validateMongoUriFormat('mongodb://u:MySecretP@ss@host/mydb', opts);
    expect(r.maskedUri).not.toContain('MySecretP@ss');
  });
});

// ─── validateMongoUriConnection ───────────────────────────────────────

describe('validateMongoUriConnection', () => {
  let mockClose;
  let mockDeleteOne;
  let mockFindOne;
  let mockInsertOne;
  let mockCollection;
  let mockDb;
  let mockClient;
  let restore;

  function makeMockClient(shouldSucceed) {
    mockInsertOne = vi.fn().mockResolvedValue({ insertedId: 'mock-id' });
    mockFindOne = vi.fn().mockImplementation((query) => ({
      _storeflowValidation: true, token: query.token, createdAt: new Date()
    }));
    mockDeleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
    mockClose = vi.fn().mockResolvedValue(undefined);

    mockCollection = {
      insertOne: mockInsertOne,
      findOne: mockFindOne,
      deleteOne: mockDeleteOne,
    };
    mockDb = { collection: vi.fn().mockReturnValue(mockCollection) };
    mockClient = {
      db: vi.fn().mockReturnValue(mockDb),
      close: mockClose,
      connect: shouldSucceed
        ? vi.fn().mockResolvedValue(undefined)
        : vi.fn().mockRejectedValue(new Error('Connection refused')),
    };

    const MockMongoClient = function () { return mockClient; };
    return MockMongoClient;
  }

  afterEach(() => {
    if (restore) restore();
  });

  it('successfully validates connection with write/read/delete', async () => {
    const MockClient = makeMockClient(true);
    restore = setMongoClientOverride(MockClient);

    const r = await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(r.ok).toBe(true);
    expect(r.code).toBe('VALID');
    expect(r.dbName).toBe('shopdb');
    expect(r.maskedUri).toBe(MASKED);

    // Verify write, read, delete cycle
    expect(mockInsertOne).toHaveBeenCalledTimes(1);
    expect(mockInsertOne.mock.calls[0][0]._storeflowValidation).toBe(true);
    expect(mockFindOne).toHaveBeenCalledTimes(1);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
  });

  it('returns safe error on connection failure', async () => {
    const MockClient = makeMockClient(false);
    restore = setMongoClientOverride(MockClient);

    const r = await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(r.ok).toBe(false);
    expect(r.code).toBe('CONNECTION_ERROR');
    expect(r.message).toBeTruthy();
    // Message must not contain the password
    expect(r.message).not.toContain('Str0ngP@ss!');
    expect(r.message).not.toContain(VALID_URI);
  });

  it('calls close in finally', async () => {
    const MockClient = makeMockClient(true);
    restore = setMongoClientOverride(MockClient);

    await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls close even on connection failure', async () => {
    const MockClient = makeMockClient(false);
    restore = setMongoClientOverride(MockClient);

    await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('returns safe error on write failure', async () => {
    const MockClient = makeMockClient(true);
    mockCollection.insertOne = vi.fn().mockRejectedValue(new Error('not authorized'));
    restore = setMongoClientOverride(MockClient);

    const r = await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(r.ok).toBe(false);
    expect(r.code).toBe('CONNECTION_ERROR');
  });

  it('returns safe error on read failure (wrong token)', async () => {
    const MockClient = makeMockClient(true);
    mockCollection.findOne = vi.fn().mockResolvedValue(null);
    restore = setMongoClientOverride(MockClient);

    const r = await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(r.ok).toBe(false);
    expect(r.code).toBe('VALIDATION_READ_FAILED');
  });

  it('returns safe error on delete failure', async () => {
    const MockClient = makeMockClient(true);
    mockCollection.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 0 });
    restore = setMongoClientOverride(MockClient);

    const r = await validateMongoUriConnection(VALID_URI, { timeoutMs: 2000 });

    expect(r.ok).toBe(false);
    expect(r.code).toBe('VALIDATION_DELETE_FAILED');
  });
});

// ─── validateMongoUri (combined) ──────────────────────────────────────

describe('validateMongoUri (combined)', () => {
  it('rejects invalid format without attempting connection', async () => {
    // No MongoClient needed — format check fails first
    const r = await validateMongoUri('mongodb://u:p@localhost/db', { mainPosDbName: 'techcross' });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('LOOPBACK_HOST');
  });

  it('returns format error message safely', async () => {
    const r = await validateMongoUri('not-a-uri');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('INVALID_SCHEME');
    // No credentials in masked output for non-URI input
    expect(r.maskedUri).not.toContain('://');
  });

  it('no full URI in any output', async () => {
    const r = await validateMongoUri('mongodb://u:p@10.0.0.1/mydb');
    const json = JSON.stringify(r);
    // Password must not appear in output
    expect(json).not.toContain('u:p');
    expect(json).not.toContain(':p@');
  });
});

// ─── Secret leakage ───────────────────────────────────────────────────

describe('secret leakage protection', () => {
  const leakTests = [
    { uri: VALID_URI, file: 'standard Atlas URI' },
    { uri: 'mongodb://admin:Sup3rS3cret!@host:27017/proddb', file: 'standard mongodb with port' },
  ];

  leakTests.forEach(({ uri }) => {
    it('maskMongoUri output does not contain password', () => {
      const masked = maskMongoUri(uri);
      expect(masked).not.toContain('Str0ngP@ss!');
      expect(masked).not.toContain('Sup3rS3cret!');
      expect(masked).not.toContain(':***@***@');
    });

    it('validateMongoUriFormat result does not contain password', () => {
      const r = validateMongoUriFormat(uri, { mainPosDbName: 'techcross' });
      const json = JSON.stringify(r);
      // Check no original password values appear in output
      expect(json).not.toContain('Str0ngP@ss!');
      expect(json).not.toContain('Sup3rS3cret!');
      expect(json).not.toContain('shopuser:Str0ngP@ss!');
      expect(json).not.toContain('admin:Sup3rS3cret!');
    });
  });

  it('validateMongoUriFormat error messages do not contain URI', () => {
    // For a valid format URI, we should only see masked form
    const r = validateMongoUriFormat(VALID_URI, { forbiddenDbNames: ['shopdb'] });
    expect(r.maskedUri).toBe(MASKED);
  });
});
