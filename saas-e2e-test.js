const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve) => {
    const u = new URL('http://localhost:8080' + path);
    const body = data ? JSON.stringify(data) : '';
    const opts = {
      hostname: u.hostname, port: u.port, path: u.pathname,
      method, headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d), raw: d }); }
        catch(e) { resolve({ status: res.statusCode, data: null, raw: d }); }
      });
    });
    req.on('error', e => resolve({ status: 0, data: null, raw: e.message }));
    req.write(body || '');
    req.end();
  });
}

let adminToken, signupId, storeId, storeCreds;
const TS = 'E2E_' + Date.now();
const email = TS + '@test.ie';

async function main() {
  // 1. Super admin login
  console.log('\n=== 1. SUPER ADMIN LOGIN ===');
  let r = await request('POST', '/api/saas/auth/login', { username: 'Lee087', password: 'O87o9o8555HL' });
  if (!r.data?.token) { console.log('FAIL:', r.raw); return; }
  adminToken = r.data.token;
  console.log('PASS - token received');

  // 2. List stores
  console.log('\n=== 2. LIST STORES ===');
  r = await request('GET', '/api/saas/stores', null, adminToken);
  console.log('PASS -', r.data?.length || 0, 'stores');

  // 3. Create signup
  console.log('\n=== 3. CREATE SIGNUP ===');
  r = await request('POST', '/api/saas/signup', {
    storeName: 'E2E ' + TS, ownerName: 'Test Owner', email,
    phone: '+353 87 123 4567', country: 'Ireland', businessType: 'phone_repair'
  });
  if (!r.data?.success) { console.log('FAIL:', r.data || r.raw); return; }
  signupId = r.data.id;
  console.log('PASS - signup created');

  // 4. Approve signup
  console.log('\n=== 4. APPROVE SIGNUP ===');
  r = await request('POST', '/api/saas/stores/approve/' + signupId, {}, adminToken);
  if (!r.data?.success) { console.log('FAIL:', r.data || r.raw); return; }
  storeId = r.data.store.id;
  storeCreds = r.data.credentials;
  console.log('PASS - store:', r.data.store.name);
  console.log('   User:', storeCreds.username);
  console.log('   Pass:', storeCreds.password);

  // 5. Store owner login
  console.log('\n=== 5. STORE OWNER LOGIN ===');
  r = await request('POST', '/api/saas/auth/login', {
    username: storeCreds.username, password: storeCreds.password
  });
  if (!r.data?.token) { console.log('FAIL:', r.data || r.raw); return; }
  console.log('PASS - store owner logged in, role:', r.data.user?.role);

  // 6. List store users
  console.log('\n=== 6. LIST STORE USERS ===');
  r = await request('GET', '/api/saas/stores/' + storeId + '/users', null, adminToken);
  if (!Array.isArray(r.data)) { console.log('FAIL:', r.data || r.raw); return; }
  console.log('PASS -', r.data.length, 'users');

  // 7. Duplicate signup rejected (same email while still pending)
  console.log('\n=== 7. DUPLICATE PENDING SIGNUP REJECTED ===');
  const dupEmail = 'dup_' + TS + '@test.ie';
  r = await request('POST', '/api/saas/signup', { storeName: 'First', ownerName: 'First', email: dupEmail });
  if (r.status !== 200) { console.log('FAIL - create first:', r.status, r.raw); return; }
  console.log('PASS - first signup created');
  r = await request('POST', '/api/saas/signup', { storeName: 'Dup', ownerName: 'Dup', email: dupEmail });
  if (r.status !== 409) { console.log('FAIL - expected 409 for duplicate, got', r.status, r.data); return; }
  console.log('PASS - 409 duplicate pending rejected');

  // 8. Wrong password rejected
  console.log('\n=== 8. WRONG PASSWORD REJECTED ===');
  r = await request('POST', '/api/saas/auth/login', { username: 'Lee087', password: 'wrong' });
  if (r.status !== 401) { console.log('FAIL - expected 401, got', r.status); return; }
  console.log('PASS - 401');

  // 9. Unauthorized access
  console.log('\n=== 9. NO-AUTH BLOCKED ===');
  r = await request('GET', '/api/saas/signup');
  if (r.status !== 401) { console.log('FAIL - expected 401, got', r.status); return; }
  console.log('PASS - 401');

  // 10. Impersonation
  console.log('\n=== 10. IMPERSONATE STORE ===');
  r = await request('POST', '/api/saas/stores/impersonate/' + storeId, {}, adminToken);
  if (!r.data?.token) { console.log('FAIL:', r.data || r.raw); return; }
  console.log('PASS - impersonation token received');

  // 11. Suspend/activate
  console.log('\n=== 11. SUSPEND STORE ===');
  r = await request('PUT', '/api/saas/stores/' + storeId + '/suspend', {}, adminToken);
  if (!r.data?.success) { console.log('FAIL:', r.data || r.raw); return; }
  console.log('PASS - suspended');

  console.log('\n=== 12. ACTIVATE STORE ===');
  r = await request('PUT', '/api/saas/stores/' + storeId + '/activate', {}, adminToken);
  if (!r.data?.success) { console.log('FAIL:', r.data || r.raw); return; }
  console.log('PASS - activated');

  // Summarize
  console.log('\n========================================');
  console.log('ALL 12 SaaS E2E TESTS PASSED');
  console.log('========================================');
  console.log('\nStore Owner Credentials:');
  console.log('  URL:     http://localhost:8080/saas/login.html');
  console.log('  Username:', storeCreds.username);
  console.log('  Password:', storeCreds.password);
}

main().catch(e => console.error('FATAL:', e));
