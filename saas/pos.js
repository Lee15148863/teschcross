/* StoreFlow POS Test Shell — fake data only. No VAT, no invoices, no real sales. */

var TOKEN = localStorage.getItem('saas_token');
var STORE_FROZEN = false;

function api(path, opts) {
  opts = opts || {};
  var headers = { 'Authorization': 'Bearer ' + TOKEN };
  if (opts.body) headers['Content-Type'] = 'application/json';
  return fetch('/api/saas/pos' + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(function(r) {
    return r.json().then(function(d) { return { status: r.status, data: d }; });
  });
}

function toast(msg, type) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  setTimeout(function() { el.className = 'toast'; }, 2500);
}

// ─── Frozen banner ────────────────────────────────────────────────────────
function renderFrozen(frozen, msg) {
  STORE_FROZEN = frozen;
  var banner = document.getElementById('frozenBanner');
  if (frozen) {
    banner.textContent = msg || 'System is in read-only mode.';
    banner.style.display = 'block';
    document.getElementById('productForm').style.display = 'none';
    document.getElementById('txForm').style.display = 'none';
    document.getElementById('addProductBtn').disabled = true;
    document.getElementById('addTxBtn').disabled = true;
  } else {
    banner.style.display = 'none';
    document.getElementById('productForm').style.display = '';
    document.getElementById('txForm').style.display = '';
  }
}

// ─── Products ─────────────────────────────────────────────────────────────
function renderProducts(products) {
  var tbody = document.getElementById('productBody');
  var empty = document.getElementById('productEmpty');
  tbody.innerHTML = '';
  if (!products || products.length === 0) {
    empty.style.display = '';
    document.getElementById('productTable').style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  document.getElementById('productTable').style.display = '';
  products.forEach(function(p) {
    var tr = document.createElement('tr');
    tr.className = p.active ? '' : 'inactive';
    tr.innerHTML = '<td>' + escapeHtml(p.name) + '</td>' +
      '<td>€' + Number(p.price).toFixed(2) + '</td>' +
      '<td>' + escapeHtml(p.category || '-') + '</td>' +
      '<td>' + (p.active && !STORE_FROZEN
        ? '<button class="btn-sm btn-danger" onclick="deleteProduct(\'' + p._id + '\')">Delete</button>'
        : p.active ? '<span style="color:#c7c7cc;font-size:11px;">—</span>'
        : '<span style="color:#c7c7cc;font-size:11px;">deleted</span>') + '</td>';
    tbody.appendChild(tr);
  });
}

function loadProducts() {
  api('/products').then(function(r) {
    if (r.status === 200) renderProducts(r.data);
    else toast('Failed to load products: ' + (r.data && r.data.error || r.status), 'error');
  });
}

function addProduct() {
  var name = document.getElementById('prodName').value.trim();
  var price = parseFloat(document.getElementById('prodPrice').value);
  var category = document.getElementById('prodCategory').value.trim();
  if (!name) { toast('Product name required', 'error'); return; }
  if (isNaN(price) || price < 0) { toast('Valid price required', 'error'); return; }
  api('/products', { method: 'POST', body: { name: name, price: price, category: category } }).then(function(r) {
    if (r.status === 201) {
      toast('Product added', 'success');
      document.getElementById('prodName').value = '';
      document.getElementById('prodPrice').value = '';
      document.getElementById('prodCategory').value = '';
      loadProducts();
      loadProductDropdown();
    } else {
      toast('Failed: ' + (r.data && r.data.error || r.status), 'error');
    }
  });
}

function deleteProduct(id) {
  if (!confirm('Delete this product? (soft delete)')) return;
  api('/products/' + id, { method: 'DELETE' }).then(function(r) {
    if (r.status === 200) { toast('Product deleted', 'success'); loadProducts(); }
    else toast('Failed: ' + (r.data && r.data.error || r.status), 'error');
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────
function renderTransactions(txs) {
  var tbody = document.getElementById('txBody');
  var empty = document.getElementById('txEmpty');
  tbody.innerHTML = '';
  if (!txs || txs.length === 0) {
    empty.style.display = '';
    document.getElementById('txTable').style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  document.getElementById('txTable').style.display = '';
  txs.forEach(function(tx) {
    var tr = document.createElement('tr');
    var itemsTxt = tx.items.map(function(i) { return i.name; }).join(', ');
    var time = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    tr.innerHTML = '<td>' + escapeHtml(itemsTxt || '-') + '</td>' +
      '<td>€' + Number(tx.total).toFixed(2) + '</td>' +
      '<td>' + tx.paymentMethod + '</td>' +
      '<td>' + time + '</td>';
    tbody.appendChild(tr);
  });
}

function loadTransactions() {
  api('/transactions?days=1').then(function(r) {
    if (r.status === 200) renderTransactions(r.data);
  });
}

function loadProductDropdown() {
  api('/products').then(function(r) {
    var sel = document.getElementById('txProduct');
    var currentVal = sel.value;
    sel.innerHTML = '<option value="">— Manual entry —</option>';
    if (r.status === 200 && r.data) {
      r.data.forEach(function(p) {
        if (!p.active) return;
        var opt = document.createElement('option');
        opt.value = p._id;
        opt.textContent = p.name + ' (€' + Number(p.price).toFixed(2) + ')';
        sel.appendChild(opt);
      });
    }
    if (currentVal) sel.value = currentVal;
  });
}

function addTransaction() {
  var productId = document.getElementById('txProduct').value;
  var amount = parseFloat(document.getElementById('txAmount').value);
  var paymentMethod = document.getElementById('txPayment').value;
  if (!paymentMethod) { toast('Payment method required', 'error'); return; }
  var body = { paymentMethod: paymentMethod };
  if (productId) {
    body.productId = productId;
    if (!isNaN(amount) && amount > 0) body.amount = amount;
  } else {
    if (isNaN(amount) || amount <= 0) { toast('Amount required for manual entry', 'error'); return; }
    body.amount = amount;
  }
  api('/transactions', { method: 'POST', body: body }).then(function(r) {
    if (r.status === 201) {
      toast('Sale added', 'success');
      document.getElementById('txAmount').value = '';
      document.getElementById('txProduct').value = '';
      loadTransactions();
      loadSummary();
    } else {
      toast('Failed: ' + (r.data && r.data.error || r.status), 'error');
    }
  });
}

// ─── Summary ──────────────────────────────────────────────────────────────
function loadSummary() {
  api('/summary').then(function(r) {
    if (r.status === 200) {
      var d = r.data;
      document.getElementById('summaryCount').textContent = d.transactionCount || 0;
      document.getElementById('summaryTotal').textContent = '€' + Number(d.totalSales || 0).toFixed(2);
      document.getElementById('summaryCash').textContent = '€' + Number(d.cashTotal || 0).toFixed(2) + ' / €' + Number(d.cardTotal || 0).toFixed(2);
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function escapeHtml(s) {
  if (!s) return '';
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ─── Init ─────────────────────────────────────────────────────────────────
function init() {
  if (!TOKEN) {
    window.location.href = '/saas/login.html';
    return;
  }
  // Check frozen status first
  api('/status').then(function(r) {
    if (r.status === 200) {
      renderFrozen(r.data.frozen, r.data.message);
    }
    // Load data regardless
    loadProducts();
    loadTransactions();
    loadSummary();
    loadProductDropdown();
  }).catch(function() {
    // Even if status fails, try loading data
    loadProducts();
    loadTransactions();
    loadSummary();
    loadProductDropdown();
  });
}

init();
