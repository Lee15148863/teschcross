/**
 * MongoDB URI validator for StoreFlow customer-owned Atlas onboarding.
 *
 * StoreFlow provides software service only. Customer owns their MongoDB Atlas.
 * This validator ensures customer-provided URIs are safe, reachable, and
 * do not point to forbidden databases (Main POS, StoreFlow Admin).
 *
 * Never log, return, or leak full URI or password.
 * Always use masked URIs in output.
 */

const crypto = require('crypto');

// ─── Helpers ──────────────────────────────────────────────────────────

function maskMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    return uri.replace(/\/\/([^:]+):(.+)@/, '//$1:***@');
  } catch {
    return '[INVALID_URI]';
  }
}

function parseMongoDbName(uri) {
  if (!uri || typeof uri !== 'string') return null;
  try {
    // Extract path after host(s) — the first segment is the database name
    const afterAt = uri.includes('@') ? uri.slice(uri.indexOf('@') + 1) : uri;
    // Remove scheme prefix
    const noScheme = afterAt.replace(/^mongodb\+srv:\/\//, '').replace(/^mongodb:\/\//, '');
    // After hosts: look for first /
    const slashIdx = noScheme.indexOf('/');
    if (slashIdx === -1) return null;
    const path = noScheme.slice(slashIdx + 1);
    // Database name is before first ? or & or end
    const qIdx = path.indexOf('?');
    const dbName = qIdx === -1 ? path : path.slice(0, qIdx);
    return dbName || null;
  } catch {
    return null;
  }
}

function parseUriParts(uri) {
  if (!uri || typeof uri !== 'string') return null;

  // Determine scheme
  let scheme, rest;
  if (uri.startsWith('mongodb+srv://')) { scheme = 'mongodb+srv'; rest = uri.slice(14); }
  else if (uri.startsWith('mongodb://')) { scheme = 'mongodb'; rest = uri.slice(10); }
  else return null;

  // Split credentials + hosts + path
  // rest = [username:password@]host1[:port1],host2[:port2][/dbname?options]

  let credentials = null;
  let hostsPart = rest;
  const atIdx = rest.lastIndexOf('@');
  if (atIdx !== -1) {
    credentials = rest.slice(0, atIdx);
    hostsPart = rest.slice(atIdx + 1);
  }

  let username = null, password = null;
  if (credentials) {
    const colonIdx = credentials.indexOf(':');
    if (colonIdx !== -1) {
      username = credentials.slice(0, colonIdx);
      password = credentials.slice(colonIdx + 1);
    } else {
      username = credentials;
    }
  }

  // Split hosts from path
  let hostsStr = hostsPart;
  let dbName = null;
  let query = null;
  const slashIdx = hostsPart.indexOf('/');
  if (slashIdx !== -1) {
    hostsStr = hostsPart.slice(0, slashIdx);
    const pathQuery = hostsPart.slice(slashIdx + 1);
    const qIdx = pathQuery.indexOf('?');
    if (qIdx !== -1) {
      dbName = pathQuery.slice(0, qIdx);
      query = pathQuery.slice(qIdx + 1);
    } else {
      dbName = pathQuery || null;
    }
  }

  // Parse hosts
  const hostEntries = hostsStr.split(',').filter(Boolean).map(h => {
    const trimmed = h.trim();
    const colonIdx = trimmed.lastIndexOf(':');
    // Handle IPv6: [::1]:port
    if (trimmed.startsWith('[')) {
      const closeBracket = trimmed.indexOf(']');
      if (closeBracket !== -1) {
        const host = trimmed.slice(0, closeBracket + 1);
        const port = trimmed.slice(closeBracket + 2); // after ]
        return { host, port: port || null, hostname: host.replace(/[\[\]]/g, '') };
      }
    }
    if (colonIdx !== -1) {
      const possiblePort = trimmed.slice(colonIdx + 1);
      // port is all digits
      if (/^\d+$/.test(possiblePort)) {
        return { host: trimmed, port: possiblePort, hostname: trimmed.slice(0, colonIdx) };
      }
    }
    return { host: trimmed, port: null, hostname: trimmed };
  });

  return { scheme, username, password, hosts: hostEntries, dbName, query, maskedUri: maskMongoUri(uri) };
}

// ─── IP / Hostname checks ─────────────────────────────────────────────

const PRIVATE_IP_RANGES = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
];

const LOOPBACKS = new Set(['localhost', '127.0.0.1', '0.0.0.1', '::1', '0.0.0.0']);

function isPrivateIP(hostname) {
  if (!hostname) return false;
  return PRIVATE_IP_RANGES.some(r => r.test(hostname));
}

function isLoopback(hostname) {
  if (!hostname) return false;
  if (LOOPBACKS.has(hostname)) return true;
  if (hostname.startsWith('127.')) return true;
  if (hostname === '::1') return true;
  return false;
}

function isPrivateNetwork(hostname) {
  if (!hostname) return false;
  return isLoopback(hostname) || isPrivateIP(hostname);
}

// ─── Format validation ────────────────────────────────────────────────

function validateMongoUriFormat(uri, options) {
  options = options || {};
  const forbiddenDbNames = options.forbiddenDbNames || [];
  const mainPosDbName = options.mainPosDbName || '';
  const adminDbName = options.adminDbName || '';

  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return { ok: false, code: 'EMPTY_URI', message: 'MongoDB URI is required.', maskedUri: '' };
  }

  const parts = parseUriParts(uri);
  if (!parts) {
    return { ok: false, code: 'INVALID_SCHEME', message: 'URI must start with mongodb:// or mongodb+srv://.', maskedUri: maskMongoUri(uri) };
  }

  if (!parts.username) {
    return { ok: false, code: 'MISSING_USERNAME', message: 'MongoDB URI must include a database username.', maskedUri: parts.maskedUri };
  }

  if (!parts.password) {
    return { ok: false, code: 'MISSING_PASSWORD', message: 'MongoDB URI must include a database password.', maskedUri: parts.maskedUri };
  }

  if (!parts.hosts || parts.hosts.length === 0) {
    return { ok: false, code: 'MISSING_HOST', message: 'MongoDB URI must include a host.', maskedUri: parts.maskedUri };
  }

  if (!parts.dbName) {
    return { ok: false, code: 'MISSING_DATABASE', message: 'MongoDB URI must include a database name (e.g., /mydb).', maskedUri: parts.maskedUri };
  }

  // Check hostnames
  for (const h of parts.hosts) {
    if (isLoopback(h.hostname)) {
      return { ok: false, code: 'LOOPBACK_HOST', message: 'MongoDB URI must not point to localhost or loopback address.', maskedUri: parts.maskedUri };
    }
    if (isPrivateIP(h.hostname)) {
      return { ok: false, code: 'PRIVATE_IP', message: 'MongoDB URI must not point to a private network address.', maskedUri: parts.maskedUri };
    }
  }

  // Check database name
  const dbName = parts.dbName;

  if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
    return { ok: false, code: 'INVALID_DB_NAME', message: 'Database name contains invalid characters.', maskedUri: parts.maskedUri, dbName };
  }

  if (mainPosDbName && dbName === mainPosDbName) {
    return { ok: false, code: 'MAIN_POS_DB', message: 'URI points to Main POS database. Customer must use a separate database.', maskedUri: parts.maskedUri, dbName };
  }

  if (adminDbName && dbName === adminDbName) {
    return { ok: false, code: 'ADMIN_DB', message: 'URI points to StoreFlow Admin database. Customer must use a separate database.', maskedUri: parts.maskedUri, dbName };
  }

  if (dbName.startsWith('saas_')) {
    return { ok: false, code: 'RESERVED_DB_PREFIX', message: 'Database name must not start with "saas_" (reserved for StoreFlow Admin).', maskedUri: parts.maskedUri, dbName };
  }

  if (forbiddenDbNames.includes(dbName)) {
    return { ok: false, code: 'FORBIDDEN_DB', message: 'URI points to a forbidden database.', maskedUri: parts.maskedUri, dbName };
  }

  return { ok: true, code: 'VALID', dbName, maskedUri: parts.maskedUri };
}

// ─── Connection validation ────────────────────────────────────────────

async function validateMongoUriConnection(uri, options) {
  options = options || {};
  const timeoutMs = options.timeoutMs || 5000;
  const MongoClient = options.MongoClient || getMongoClient();
  const maskedUri = maskMongoUri(uri);
  const dbName = parseMongoDbName(uri);

  if (!MongoClient) {
    return { ok: false, code: 'NO_CLIENT', message: 'MongoClient not available. Cannot validate connection.', maskedUri, dbName };
  }

  let client = null;
  const token = crypto.randomUUID();
  const validationDoc = { _storeflowValidation: true, token, createdAt: new Date() };

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
    });

    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('_storeflow_validation');

    // Write
    const insertResult = await collection.insertOne(validationDoc);
    if (!insertResult || !insertResult.insertedId) {
      return { ok: false, code: 'VALIDATION_WRITE_FAILED', message: 'Could not write validation document to database. Check write permissions.', maskedUri, dbName };
    }

    // Read
    const readDoc = await collection.findOne({ token });
    if (!readDoc || readDoc.token !== token) {
      return { ok: false, code: 'VALIDATION_READ_FAILED', message: 'Could not read back validation document. Check read permissions.', maskedUri, dbName };
    }

    // Delete
    const deleteResult = await collection.deleteOne({ token });
    if (!deleteResult || deleteResult.deletedCount !== 1) {
      return { ok: false, code: 'VALIDATION_DELETE_FAILED', message: 'Could not delete validation document. Cleanup may be needed.', maskedUri, dbName };
    }

    return { ok: true, code: 'VALID', dbName, maskedUri };
  } catch (err) {
    const code = err.name === 'MongooseError' || err.name === 'MongoError' || err.name === 'MongoServerError'
      ? 'CONNECTION_FAILED' : 'CONNECTION_ERROR';
    const safeMessage = err.message
      ? err.message.replace(uri, '[REDACTED]').replace(/:\/\/[^@]+@/, '://***:***@')
      : 'Could not connect to MongoDB. Verify the URI and network access.';
    return { ok: false, code, message: safeMessage, maskedUri, dbName };
  } finally {
    if (client) {
      try { await client.close(); } catch { /* ignore close errors */ }
    }
  }
}

// ─── Combined validation ──────────────────────────────────────────────

async function validateMongoUri(uri, options) {
  // First: format check (fast, no connection)
  const formatResult = validateMongoUriFormat(uri, options);
  if (!formatResult.ok) {
    return formatResult;
  }

  // Second: connection check (slow, requires network)
  const connectionResult = await validateMongoUriConnection(uri, options);
  return connectionResult;
}

// ─── Lazy MongoClient accessor (allows mocking in tests) ──────────────

let _mongoClientModule = null;
function getMongoClient() {
  try {
    if (!_mongoClientModule) {
      _mongoClientModule = require('mongodb').MongoClient;
    }
    return _mongoClientModule;
  } catch {
    return null;
  }
}

// Allow tests to inject a mock
function setMongoClientOverride(mock) {
  const original = getMongoClient;
  const restore = () => { _mongoClientModule = null; };
  _mongoClientModule = mock;
  return restore;
}

module.exports = {
  maskMongoUri,
  parseMongoDbName,
  parseUriParts,
  validateMongoUriFormat,
  validateMongoUriConnection,
  validateMongoUri,
  setMongoClientOverride,
};
