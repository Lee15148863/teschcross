/**
 * Boss Control Dashboard — JavaScript Logic
 *
 * RUNBOOK §1 (L1): UI layer only — no business logic, no calculations.
 * All financial truth comes from the backend Root API.
 * RUNBOOK §6: NEVER calculate VAT, totals, or profits in frontend.
 */

// ─── State ─────────────────────────────────────────────────────
let _modalCallback = null;
let _ledgerFilter = 'all';

// ─── Auth ──────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('inv_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('inv_user')); } catch(e) { return null; }
}

function checkAuth() {
  const token = getToken();
  const user = getUser();
  if (token && user && user.role === 'root') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appHeader').style.display = 'flex';
    document.getElementById('tabBar').style.display = 'flex';
    document.getElementById('userBadge').textContent = user.displayName || user.username;
    document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    document.getElementById('closeDate').value = today;
    document.getElementById('ledgerDate').value = today;
    const es = document.getElementById('exportStart');
    const ee = document.getElementById('exportEnd');
    if (es) es.value = monthAgo;
    if (ee) ee.value = today;
    loadOverview();
    loadUsers();
    loadLedger();
    loadRefundHistory();
    loadDevices();
    loadSystemStatus();
    return true;
  }
  return false;
}

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    errorEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/inv/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, humanCheck: true }),
    });
    const data = await res.json();

    if (res.ok && data.token && data.user) {
      if (data.user.role !== 'root') {
        errorEl.textContent = 'Root access required. You do not have permission.';
        errorEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Login';
        return;
      }
      localStorage.setItem('inv_token', data.token);
      localStorage.setItem('inv_user', JSON.stringify(data.user));
      checkAuth();
    } else {
      errorEl.textContent = data.error || 'Login failed';
      errorEl.classList.add('show');
    }
  } catch(err) {
    errorEl.textContent = 'Connection error. Check server.';
    errorEl.classList.add('show');
  }
  btn.disabled = false;
  btn.textContent = 'Login';
}

function doLogout() {
  localStorage.removeItem('inv_token');
  localStorage.removeItem('inv_user');
  location.reload();
}

// ─── API Helper ────────────────────────────────────────────────
async function api(path, options = {}) {
  const token = getToken();
  if (!token) { doLogout(); throw new Error('No token'); }

  const headers = { 'Authorization': 'Bearer ' + token };
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    showToast('Session expired. Please login again.');
    doLogout();
    throw new Error('Auth failed');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._hide);
  el._hide = setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── Modal (bottom sheet) ──────────────────────────────────────
function showConfirm(title, body, cb, dangerLabel) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  const confirmBtn = document.getElementById('modalConfirmBtn');
  confirmBtn.textContent = dangerLabel || 'Confirm';
  confirmBtn.className = 'btn btn-' + (dangerLabel === 'Cancel' ? 'secondary' : 'danger') + ' btn-block';
  _modalCallback = cb;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  _modalCallback = null;
}

function confirmModal() {
  const cb = _modalCallback;
  closeModal();
  if (typeof cb === 'function') cb();
}

// ─── Tab Switching ─────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const tabBtn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
  if (tabBtn) tabBtn.classList.add('active');

  // Lazy load
  if (name === 'overview' && !window._overviewLoaded) { loadOverview(); }
  if (name === 'users') { loadUsers(); }
  if (name === 'ledger') { loadLedger(); }
  if (name === 'refund') { loadRefundHistory(); }
  if (name === 'devices') { loadDevices(); }
  if (name === 'system') { loadSystemStatus(); }
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════

async function loadOverview() {
  try {
    window._overviewLoaded = true;
    const data = await api('/api/inv/root/overview');
    const t = data.today;

    document.getElementById('ovCash').textContent = '€' + (t.payment?.cash || 0).toFixed(2);
    document.getElementById('ovCard').textContent = '€' + (t.payment?.card || 0).toFixed(2);
    document.getElementById('ovCashTxns').textContent = 'Ledger in: €' + (t.ledger?.cashIn || 0).toFixed(2);
    document.getElementById('ovCardTxns').textContent = 'Ledger in: €' + (t.ledger?.cardIn || 0).toFixed(2);
    document.getElementById('ovVat').textContent = '€' + (t.vat?.totalVat || 0).toFixed(2);
    document.getElementById('ovVatDetail').textContent = '23%: €' + (t.vat?.standard23?.vat || 0).toFixed(2) + ' | 13.5%: €' + (t.vat?.reduced135?.vat || 0).toFixed(2);
    document.getElementById('ovProfit').textContent = '€' + (t.sales?.net || 0).toFixed(2);
    document.getElementById('ovGross').textContent = 'Gross: €' + (t.sales?.gross || 0).toFixed(2);
    document.getElementById('ovSalesCount').textContent = t.sales?.count || 0;
    document.getElementById('ovRefundCount').textContent = t.refunds?.count + ' refunds (-€' + (t.refunds?.total || 0).toFixed(2) + ')';
    document.getElementById('ovRefunds').textContent = '€' + (t.refunds?.total || 0).toFixed(2);

    // Device PL
    document.getElementById('ovDevSold').textContent = data.devices?.soldCount + ' / ' + data.devices?.totalDevices + ' devices';
    document.getElementById('ovDevProfit').textContent = '€' + (data.devices?.grossProfit || 0).toFixed(2);

    // Daily close status
    const closeEl = document.getElementById('ovCloseStatus');
    if (data.lastDailyClose) {
      closeEl.innerHTML = '<span class="badge badge-green">Closed: ' + data.lastDailyClose.date + '</span>';
    } else {
      closeEl.innerHTML = '<span class="badge badge-orange">No close yet</span>';
    }
  } catch(err) {
    document.getElementById('ovCash').textContent = '—';
    showToast('Failed to load overview: ' + err.message);
  }
}

function refreshOverview() { loadOverview(); showToast('Refreshed'); }

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

async function loadUsers() {
  const container = document.getElementById('userList');
  try {
    const users = await api('/api/inv/root/users');
    container.innerHTML = '<div class="card">' + users.map(u => {
      const roleBadge = { root: 'badge-red', manager: 'badge-blue', staff: 'badge-gray' };
      return '<div class="list-item">' +
        '<div><div class="item-title">' + esc(u.displayName) + ' <span class="badge ' + (roleBadge[u.role] || 'badge-gray') + '">' + u.role + '</span></div>' +
        '<div class="item-sub">@' + esc(u.username) + (u.active ? '' : ' • <span style="color:#ff3b30">disabled</span>') + '</div></div>' +
        '<div class="btn-group" style="gap:4px">' +
        '<button class="btn btn-sm btn-secondary" onclick="changeUserRole(\'' + u._id + '\',\'' + u.role + '\')">Role</button>' +
        '<button class="btn btn-sm ' + (u.active ? 'btn-warning' : 'btn-success') + '" onclick="toggleUserActive(\'' + u._id + '\',' + u.active + ')">' + (u.active ? 'Disable' : 'Enable') + '</button>' +
        '</div></div>';
    }).join('') + '</div>';
  } catch(err) {
    container.innerHTML = '<div class="card"><p style="color:#ff3b30;text-align:center">' + esc(err.message) + '</p></div>';
  }
}

function showCreateUser() {
  const body = '<div class="input-group"><label>Username</label><input type="text" id="cuUser" placeholder="Username"></div>' +
    '<div class="input-group"><label>Password</label><input type="password" id="cuPass" placeholder="Min 6 characters"></div>' +
    '<div class="input-group"><label>Display Name</label><input type="text" id="cuName" placeholder="Display name"></div>' +
    '<div class="input-group"><label>Role</label><select id="cuRole"><option value="staff">Staff</option><option value="manager">Manager</option><option value="root">Root</option></select></div>';
  showConfirm('Create User', body, doCreateUser, 'Create');
}

async function doCreateUser() {
  const username = document.getElementById('cuUser')?.value;
  const password = document.getElementById('cuPass')?.value;
  const displayName = document.getElementById('cuName')?.value;
  const role = document.getElementById('cuRole')?.value;
  if (!username || !password || !displayName || !role) { showToast('All fields required'); return; }

  try {
    await api('/api/inv/root/users/create', {
      method: 'POST',
      body: { username, password, displayName, role },
    });
    showToast('User created');
    loadUsers();
  } catch(err) { showToast(err.message); }
}

async function toggleUserActive(id, current) {
  if (!current) {
    // Enabling — just do it
    try {
      await api('/api/inv/root/users/' + id, { method: 'PATCH', body: { active: true } });
      showToast('User enabled');
      loadUsers();
    } catch(err) { showToast(err.message); }
    return;
  }
  // Disabling — confirm
  showConfirm('Disable User', '<p style="color:#ff3b30;font-weight:500">This user will lose access to the system.</p>', async () => {
    try {
      await api('/api/inv/root/users/' + id, { method: 'PATCH', body: { active: false } });
      showToast('User disabled');
      loadUsers();
    } catch(err) { showToast(err.message); }
  }, 'Disable');
}

async function changeUserRole(id, currentRole) {
  const nextRole = currentRole === 'staff' ? 'manager' : currentRole === 'manager' ? 'root' : 'staff';
  showConfirm('Change Role', '<p>Change to <strong>' + nextRole + '</strong>?</p>', async () => {
    try {
      await api('/api/inv/root/users/' + id, { method: 'PATCH', body: { role: nextRole } });
      showToast('Role changed to ' + nextRole);
      loadUsers();
    } catch(err) { showToast(err.message); }
  }, 'Change');
}

// ═══════════════════════════════════════════════════════════════
// LEDGER
// ═══════════════════════════════════════════════════════════════

function filterLedger(type) {
  _ledgerFilter = type;
  document.querySelectorAll('#ledgerFilters .filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === type));
  loadLedger();
}

async function loadLedger() {
  const container = document.getElementById('ledgerEntries');
  const date = document.getElementById('ledgerDate').value;

  try {
    const params = new URLSearchParams();
    if (date) { params.set('startDate', date); params.set('endDate', date); }
    if (_ledgerFilter !== 'all') params.set('entryType', _ledgerFilter);
    params.set('limit', '50');

    const data = await api('/api/inv/root/ledger?' + params.toString());
    document.getElementById('ledgerNet').textContent = '€' + (data.summary?.net || 0).toFixed(2);
    document.getElementById('ledgerNet').className = 'card-value ' + ((data.summary?.net || 0) >= 0 ? 'green' : 'red');

    if (data.entries.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No entries</p></div>';
      return;
    }

    container.innerHTML = '<div class="card">' + data.entries.slice(0, 30).map(e => {
      const dirColor = e.direction === 'in' ? 'green' : 'red';
      const dirSign = e.direction === 'in' ? '+' : '-';
      const typeLabel = { sale: 'Sale', refund: 'Refund', expense: 'Expense', supplier: 'Supplier', device_buy: 'Device Buy', bank_in: 'Bank In', bank_out: 'Bank Out' };
      return '<div class="list-item">' +
        '<div><div class="item-title">' + (typeLabel[e.entryType] || e.entryType) + '</div>' +
        '<div class="item-sub">' + (e.receiptNumber || '') + ' • ' + new Date(e.createdAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</div></div>' +
        '<div class="item-right"><span class="card-value ' + dirColor + '">' + dirSign + '€' + (e.amount || 0).toFixed(2) + '</span>' +
        '<div class="item-sub">' + (e.paymentMethod || '') + '</div></div></div>';
    }).join('') + '</div>';

    if (data.entries.length > 30) {
      container.innerHTML += '<p style="text-align:center;color:#8e8e93;font-size:13px;padding:8px">Showing 30 of ' + data.entries.length + ' entries</p>';
    }
  } catch(err) {
    container.innerHTML = '<div class="card"><p style="color:#ff3b30;text-align:center">' + esc(err.message) + '</p></div>';
  }
}

// ═══════════════════════════════════════════════════════════════
// REFUND
// ═══════════════════════════════════════════════════════════════

async function doForceRefund() {
  const receipt = document.getElementById('refundReceipt').value.trim();
  const method = document.getElementById('refundMethod').value;
  const reason = document.getElementById('refundReason').value.trim() || 'Root forced refund';

  if (!receipt) { showToast('Receipt number required'); return; }

  showConfirm('Execute Refund', '<p>Refund <strong>' + esc(receipt) + '</strong> via <strong>' + method + '</strong>?</p><p style="color:#ff3b30;font-size:14px;margin-top:8px">This will reverse the full transaction amount.</p>', async () => {
    try {
      const result = await api('/api/inv/root/refund/force', {
        method: 'POST',
        body: { receiptNumber: receipt, refundMethod: method, reason },
      });
      showToast('Refund executed: €' + (result.totalRefund || 0).toFixed(2));
      document.getElementById('refundReceipt').value = '';
      loadRefundHistory();
    } catch(err) { showToast(err.message); }
  }, 'Execute Refund');
}

async function doReverseRefund() {
  const receipt = document.getElementById('reverseReceipt').value.trim();
  if (!receipt) { showToast('Refund receipt number required'); return; }

  showConfirm('Reverse Refund', '<p>Reverse refund <strong>' + esc(receipt) + '</strong>?</p><p style="color:#ff3b30;font-size:14px;margin-top:8px">This will create a compensating refund to reverse the original refund.</p>', async () => {
    try {
      const result = await api('/api/inv/root/refund/reverse', {
        method: 'POST',
        body: { receiptNumber: receipt, reason: 'Root reversal' },
      });
      showToast('Refund reversed');
      document.getElementById('reverseReceipt').value = '';
      loadRefundHistory();
    } catch(err) { showToast(err.message); }
  }, 'Reverse');
}

async function loadRefundHistory() {
  const container = document.getElementById('refundHistory');
  try {
    const data = await api('/api/inv/root/refund/history?limit=10');
    if (data.refunds.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No refunds</p></div>';
      return;
    }

    container.innerHTML = data.refunds.map(r => {
      return '<div class="list-item">' +
        '<div><div class="item-title">' + esc(r.receiptNumber) + '</div>' +
        '<div class="item-sub">' + (r.originalReceipt ? 'Original: ' + r.originalReceipt : '') + ' • ' + new Date(r.createdAt).toLocaleDateString('en-GB') + '</div></div>' +
        '<div class="item-right"><span class="card-value red">-€' + Math.abs(r.totalAmount || 0).toFixed(2) + '</span>' +
        '<div class="item-sub">' + (r.paymentMethod || '') + '</div></div></div>';
    }).join('');
  } catch(err) {
    container.innerHTML = '<p style="color:#8e8e93;text-align:center">' + esc(err.message) + '</p>';
  }
}

// ═══════════════════════════════════════════════════════════════
// DEVICES
// ═══════════════════════════════════════════════════════════════

let _deviceFilter = '';

function filterDevices(status) {
  _deviceFilter = status;
  document.querySelectorAll('#deviceFilters .filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === status));
  loadDevices();
}

async function loadDevices() {
  const listContainer = document.getElementById('deviceList');
  const summaryContainer = document.getElementById('deviceSummary');
  try {
    const params = new URLSearchParams();
    if (_deviceFilter) params.set('status', _deviceFilter);
    params.set('limit', '50');

    const data = await api('/api/inv/root/devices?' + params.toString());

    // Summary
    if (data.count > 0) {
      summaryContainer.innerHTML = '<div class="card" style="margin-bottom:12px">' +
        '<div class="card-row"><span class="card-label">Total Devices</span><span class="card-value">' + data.count + '</span></div>' +
        '<div class="card-row"><span class="card-label">Total Buy</span><span class="card-value red">€' + (data.totalBuyPrice || 0).toFixed(2) + '</span></div>' +
        '<div class="card-row"><span class="card-label">Total Sell</span><span class="card-value green">€' + (data.totalSellPrice || 0).toFixed(2) + '</span></div>' +
        '<div class="card-row"><span class="card-label">Gross Profit</span><span class="card-value ' + ((data.grossProfit || 0) >= 0 ? 'green' : 'red') + '">€' + (data.grossProfit || 0).toFixed(2) + '</span></div></div>';
    } else {
      summaryContainer.innerHTML = '';
    }

    if (!data.devices || data.devices.length === 0) {
      listContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">📱</div><p>No devices</p></div>';
      return;
    }

    listContainer.innerHTML = '<div class="card">' + data.devices.map(d => {
      const statusBadge = { SOLD: 'badge-green', TESTED: 'badge-blue', PENDING: 'badge-orange', BUY_IN: 'badge-gray' };
      const profit = (d.sellPrice || 0) - (d.buyPrice || 0);
      return '<div class="list-item">' +
        '<div><div class="item-title">' + esc(d.serialNumber) + ' <span class="badge ' + (statusBadge[d.status] || 'badge-gray') + '">' + d.status + '</span></div>' +
        '<div class="item-sub">Buy: €' + (d.buyPrice || 0).toFixed(2) + (d.sellPrice ? ' | Sell: €' + d.sellPrice.toFixed(2) : '') + ' | PL: <span class="' + (profit >= 0 ? 'green' : 'red') + '">€' + profit.toFixed(2) + '</span></div></div>' +
        '<div><button class="btn btn-sm btn-secondary" onclick="editDevice(\'' + d.serialNumber + '\')">Edit</button></div></div>';
    }).join('') + '</div>';

    if (data.devices.length > 50) {
      listContainer.innerHTML += '<p style="text-align:center;color:#8e8e93;font-size:13px;padding:8px">Showing 50 of ' + data.devices.length + '</p>';
    }
  } catch(err) {
    listContainer.innerHTML = '<div class="card"><p style="color:#ff3b30;text-align:center">' + esc(err.message) + '</p></div>';
  }
}

// ─── Device Edit (inline in modal) ─────────────────────────────
async function editDevice(serialNumber) {
  // Fetch current device data
  const data = await api('/api/inv/root/devices?limit=100&status=');
  const device = data.devices?.find(d => d.serialNumber === serialNumber);
  if (!device) { showToast('Device not found'); return; }

  const body = '<div class="input-group"><label>Buy Price (€)</label><input type="number" step="0.01" id="devBuyPrice" value="' + (device.buyPrice || 0) + '"></div>' +
    '<div class="input-group"><label>Sell Price (€)</label><input type="number" step="0.01" id="devSellPrice" value="' + (device.sellPrice || 0) + '"></div>' +
    '<div class="input-group"><label>Status</label><select id="devStatus"><option value="BUY_IN" ' + (device.status === 'BUY_IN' ? 'selected' : '') + '>BUY_IN</option><option value="PENDING" ' + (device.status === 'PENDING' ? 'selected' : '') + '>PENDING</option><option value="TESTED" ' + (device.status === 'TESTED' ? 'selected' : '') + '>TESTED</option><option value="SOLD" ' + (device.status === 'SOLD' ? 'selected' : '') + '>SOLD</option></select></div>' +
    '<div class="input-group"><label>Notes</label><input type="text" id="devNotes" value="' + esc(device.notes || '') + '"></div>';

  showConfirm('Edit Device: ' + serialNumber, body, async () => {
    const buyPrice = parseFloat(document.getElementById('devBuyPrice')?.value);
    const sellPrice = document.getElementById('devSellPrice')?.value !== '' ? parseFloat(document.getElementById('devSellPrice').value) : undefined;
    const status = document.getElementById('devStatus')?.value;
    const notes = document.getElementById('devNotes')?.value;

    const payload = {};
    if (!isNaN(buyPrice)) payload.buyPrice = buyPrice;
    if (sellPrice !== undefined && !isNaN(sellPrice)) payload.sellPrice = sellPrice;
    if (status) payload.status = status;
    payload.notes = notes || '';

    try {
      await api('/api/inv/root/devices/' + device._id, { method: 'PATCH', body: payload });
      showToast('Device updated');
      loadDevices();
    } catch(err) { showToast(err.message); }
  }, 'Save');
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM CONTROL
// ═══════════════════════════════════════════════════════════════

async function loadSystemStatus() {
  try {
    const data = await api('/api/inv/root/system/status');
    document.getElementById('sysTime').textContent = new Date(data.serverTime).toLocaleString('en-GB');
    document.getElementById('sysUsers').textContent = data.activeUsers + ' active';

    const pausedEl = document.getElementById('sysPaused');
    if (data.systemPaused) {
      pausedEl.innerHTML = '<span class="status-dot red"></span> PAUSED';
    } else {
      pausedEl.innerHTML = '<span class="status-dot green"></span> Running';
    }

    const lockedEl = document.getElementById('sysLocked');
    if (data.transactionsLocked) {
      lockedEl.innerHTML = '<span class="status-dot red"></span> Locked';
    } else {
      lockedEl.innerHTML = '<span class="status-dot green"></span> Unlocked';
    }

    const closeEl = document.getElementById('sysLastClose');
    if (data.lastDailyClose) {
      closeEl.textContent = data.lastDailyClose.date + ' (' + data.lastDailyClose.status + ')';
    } else {
      closeEl.textContent = 'No close yet';
    }
  } catch(err) {
    showToast('Failed to load system status');
  }
}

async function doForceClose() {
  const date = document.getElementById('closeDate').value;
  if (!date) { showToast('Select a date'); return; }

  showConfirm('Force Daily Close', '<p>Close <strong>' + date + '</strong>?</p><p style="color:#ff3b30;font-size:14px;margin-top:8px">This will lock all transactions for this day.</p>', async () => {
    try {
      await api('/api/inv/root/daily-close/force', { method: 'POST', body: { date, skipDevicePL: true } });
      showToast('Daily close completed for ' + date);
      loadSystemStatus();
    } catch(err) { showToast(err.message); }
  }, 'Force Close');
}

async function doReopenClose() {
  const date = document.getElementById('closeDate').value;
  if (!date) { showToast('Select a date'); return; }

  showConfirm('Reopen Daily Close', '<p>Reopen <strong>' + date + '</strong>?</p><p style="color:#ff3b30;font-size:14px;margin-top:8px">This will allow modifications to closed day transactions. Use with caution.</p>', async () => {
    try {
      await api('/api/inv/root/daily-close/reopen', { method: 'POST', body: { date, reason: 'Root reopen' } });
      showToast('Daily close reopened for ' + date);
      loadSystemStatus();
    } catch(err) { showToast(err.message); }
  }, 'Reopen');
}

async function doSystemPause() {
  showConfirm('Pause POS System', '<p style="color:#ff3b30;font-weight:500">This will STOP all POS operations immediately.</p><p style="font-size:14px;margin-top:8px">Staff will not be able to process sales.</p>', async () => {
    try {
      await api('/api/inv/root/system/pause', { method: 'POST', body: { reason: 'Root emergency stop' } });
      showToast('System paused');
      loadSystemStatus();
    } catch(err) { showToast(err.message); }
  }, 'Pause System');
}

async function doSystemResume() {
  showConfirm('Resume POS System', '<p>Restore normal POS operations?</p>', async () => {
    try {
      await api('/api/inv/root/system/resume', { method: 'POST' });
      showToast('System resumed');
      loadSystemStatus();
    } catch(err) { showToast(err.message); }
  }, 'Resume');
}

async function doLockTransactions() {
  showConfirm('Lock All Transactions', '<p style="color:#ff3b30;font-weight:500">This will prevent ANY modification to historical transactions.</p><p style="font-size:14px;margin-top:8px">This action is reversible via system controls.</p>', async () => {
    try {
      await api('/api/inv/root/system/lock-all-transactions', { method: 'POST' });
      showToast('Transactions locked');
      loadSystemStatus();
    } catch(err) { showToast(err.message); }
  }, 'Lock All');
}

async function loadAuditLog() {
  const container = document.getElementById('auditLog');
  try {
    const data = await api('/api/inv/root/audit-log?limit=20');
    if (data.logs.length === 0) {
      container.innerHTML = '<p style="color:#8e8e93;text-align:center">No audit entries</p>';
      return;
    }

    container.innerHTML = data.logs.map(l => {
      const actionName = l.action.replace('root.', '');
      return '<div class="list-item">' +
        '<div><div class="item-title" style="font-size:13px">' + esc(actionName) + '</div>' +
        '<div class="item-sub">' + esc(l.targetType || '') + ' • ' + new Date(l.createdAt).toLocaleString('en-GB') + '</div></div>' +
        '<div style="font-size:12px;color:#8e8e93;max-width:100px;overflow:hidden;text-overflow:ellipsis">' + esc(l.targetId || '') + '</div></div>';
    }).join('');
  } catch(err) {
    container.innerHTML = '<p style="color:#8e8e93;text-align:center">' + esc(err.message) + '</p>';
  }
}

// ─── Export CSV ────────────────────────────────────────────────
async function exportCsv(dataset) {
  const names = {
    'transactions': 'Transactions',
    'ledger': 'Ledger',
    'audit': 'Audit Log',
    'daily-close': 'Daily Close',
    'vat-summary': 'VAT Summary',
  };
  const label = names[dataset] || dataset;

  const startDate = document.getElementById('exportStart')?.value || '';
  const endDate = document.getElementById('exportEnd')?.value || '';

  let body = '<p>Download <strong>' + label + '</strong> as CSV?</p>';
  if (startDate || endDate) {
    body += '<p style="font-size:13px;color:#8e8e93;margin-top:4px">Period: ' +
      (startDate || '…') + ' → ' + (endDate || '…') + '</p>';
  }

  showConfirm('Export ' + label, body, async () => {
    try {
      const token = getToken();
      if (!token) { showToast('Not authenticated'); return; }

      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();

      const url = '/api/inv/root/export/csv/' + dataset + (qs ? '?' + qs : '');

      showToast('Downloading ' + label + '…');

      const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = dataset + '-' + new Date().toISOString().split('T')[0] + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      showToast('✅ ' + label + ' downloaded');
    } catch(err) {
      showToast('❌ ' + err.message);
    }
  }, 'Download');
}

// ─── Utility ──────────────────────────────────────────────────
function esc(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Keyboard shortcut: Enter to login ────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) {
    document.getElementById('loginUser').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('loginPass').focus();
    });
    document.getElementById('loginPass').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doLogin();
    });
  }
});
