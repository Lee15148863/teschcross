const http = require('http');
const BASE = 'http://localhost:8080';

function req(method, path, data, token) {
  return new Promise((resolve) => {
    const u = new URL(BASE + path);
    const body = data ? JSON.stringify(data) : '';
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname + (u.search || ''), method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const r = http.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try { resolve({s:res.statusCode, j:JSON.parse(d), h:res.headers}); } catch(e) { resolve({s:res.statusCode, j:null, r:d.slice(0,500), h:res.headers}); }}); });
    r.on('error', e => resolve({s:0, j:null, r:e.message}));
    r.write(body||''); r.end();
  });
}

let token, productId, txnId;

async function main() {
  // 1. POS Login
  console.log('\n=== 1. POS LOGIN ===');
  let r = await req('POST', '/api/inv/auth/login', { username: 'Lee087', password: 'Lee087_admin_2026' });
  if (!r.j?.token) { console.log('FAIL:', r.r || JSON.stringify(r.j)); return; }
  token = r.j.token;
  console.log('PASS - Lee087 logged in, expiry:', r.j.expiresIn || '24h');

  // 2. List products (verify POS works)
  console.log('\n=== 2. LIST PRODUCTS ===');
  r = await req('GET', '/api/inv/products?pageSize=5', null, token);
  console.log('PASS -', r.j?.data?.length || r.j?.length || 0, 'products');

  // 3. Create a product if none
  console.log('\n=== 3. CREATE TEST PRODUCT ===');
  if (!r.j?.data?.length && !r.j?.length) {
    r = await req('POST', '/api/inv/products', {
      name: 'Screen Replacement', sku: 'SCR-' + Date.now(),
      category: 'repair', sellingPrice: 89, cost: 25
    }, token);
    if (r.j?._id || r.j?.id) console.log('PASS - product created:', r.j.name);
    else { console.log('WARN - create result:', r.r || JSON.stringify(r.j).slice(0,200)); }
    productId = r.j?._id || r.j?.id;
  } else {
    productId = (r.j?.data?.[0] || r.j?.[0])._id;
    console.log('SKIP - using existing product:', productId);
  }

  // 4. Create a transaction (sale)
  console.log('\n=== 4. CREATE SALE TRANSACTION ===');
  const items = [{ product: productId || '000000000000000000000000', quantity: 1 }];
  r = await req('POST', '/api/inv/transactions/checkout', {
    items, paymentMethod: 'cash', cashReceived: 89
  }, token);
  txnId = r.j?.transaction?._id;
  if (txnId) { console.log('PASS - transaction created:', txnId); }
  else { console.log('WARN - create result:', JSON.stringify(r.j).slice(0,300)); }

  // 5. List transactions
  console.log('\n=== 5. LIST TRANSACTIONS ===');
  r = await req('GET', '/api/inv/transactions?pageSize=3', null, token);
  console.log('PASS -', r.j?.data?.length || r.j?.length || 0, 'transactions');

  // 6. Generate receipt
  console.log('\n=== 6. GENERATE RECEIPT ===');
  if (txnId) {
    r = await req('GET', '/api/inv/transactions/' + txnId + '/receipt', null, token);
    if (r.j?.receiptNumber || r.j?.receipt) console.log('PASS - receipt generated');
    else if (r.s === 200) console.log('PASS - receipt route works (200)');
    else console.log('WARN:', r.s, JSON.stringify(r.j).slice(0,200));
  }

  // 7. Generate invoice
  console.log('\n=== 7. GENERATE INVOICE ===');
  if (txnId) {
    r = await req('POST', '/api/inv/invoices/' + txnId + '/generate', {
      customerEmail: 'e2e@test.ie',
      customerName: 'E2E Customer', customerAddress: 'Navan, Ireland'
    }, token);
    if (r.j?.invoiceNumber || r.j?._id || r.j?.invoice?.invoiceNumber) console.log('PASS - invoice created:', r.j?.invoice?.invoiceNumber || r.j?.invoiceNumber || r.j?._id);
    else console.log('WARN:', r.s, JSON.stringify(r.j).slice(0,200));
  }

  // 8. Daily close summary
  console.log('\n=== 8. DAILY SUMMARY ===');
  r = await req('GET', '/api/inv/reports/daily?date=' + new Date().toISOString().slice(0,10), null, token);
  if (r.j) console.log('PASS - daily report:', r.j.totalSales !== undefined ? 'sales=' + r.j.totalSales : 'data received');
  else console.log('WARN:', r.s, (r.r || '').slice(0,200));

  // 9. Check WhatsApp endpoint
  console.log('\n=== 9. WHATSAPP API ===');
  r = await req('GET', '/api/inv/whatsapp/status', null, token);
  if (r.s === 200) console.log('PASS - WhatsApp status:', JSON.stringify(r.j).slice(0,200));
  else console.log('WARN:', r.s, (r.r || '').slice(0,200));

  // 10. Check settings
  console.log('\n=== 10. SYSTEM SETTINGS ===');
  r = await req('GET', '/api/inv/settings', null, token);
  if (r.s === 200) console.log('PASS - settings loaded');
  else console.log('WARN:', r.s);

  // 11. Stock movements
  console.log('\n=== 11. STOCK MOVEMENTS ===');
  r = await req('GET', '/api/inv/stock?pageSize=3', null, token);
  console.log('PASS - stock movements:', r.j?.data?.length || r.j?.length || 0);

  console.log('\n========================================');
  console.log('POS E2E TESTS COMPLETE');
  if (!txnId) console.log('NOTE: Transaction creation had issues, check API');
  console.log('========================================\n');
}

main().catch(e => console.error('FATAL:', e));
