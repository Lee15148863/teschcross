/**
 * Tech Cross 进销存系统 — 前端公共模块
 * JWT token 管理、API 请求封装、角色权限检查、通用工具
 */

const INV_API_BASE = '/api/inv';

// ─── Token 管理 ─────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('inv_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('inv_user'));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  // Check token expiry (JWT payload is base64 encoded)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'inv-login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!requireAuth()) return false;
  const user = getUser();
  if (!user || user.role !== 'root') {
    window.location.href = 'inv-login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('inv_token');
  localStorage.removeItem('inv_user');
  window.location.href = 'inv-login.html';
}

// ─── API 请求封装 ────────────────────────────────────────────────────────────

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

async function invFetch(url, opts) {
  opts = opts || {};
  opts.headers = authHeaders();
  const res = await fetch(INV_API_BASE + url, opts);
  if (res.status === 401) {
    logout();
    return null;
  }
  return res;
}

// ─── 角色权限检查 ────────────────────────────────────────────────────────────

function isAdmin() {
  const user = getUser();
  return user && user.role === 'root';
}

function isStaff() {
  const user = getUser();
  return user && (user.role === 'staff' || user.role === 'root');
}

/**
 * 初始化页面公共元素：显示用户名、角色、隐藏/显示管理菜单
 */
function initPageAuth() {
  if (!requireAuth()) return false;
  const user = getUser();

  // Display name
  const displayNameEl = document.getElementById('displayName');
  if (displayNameEl) displayNameEl.textContent = user.displayName || user.username;

  // Role badge
  const roleBadgeEl = document.getElementById('roleBadge');
  if (roleBadgeEl) roleBadgeEl.textContent = user.role === 'root' ? '店主' : '员工';

  // Show admin sections
  if (isAdmin()) {
    const adminSection = document.getElementById('adminSection');
    if (adminSection) adminSection.style.display = '';
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }

  return true;
}

// ─── UI Language Mode ────────────────────────────────────────────────
// storeflowUiMode in localStorage: 'en' (default) or 'bi' (bilingual)
// Display-layer only — never changes stored DB values.

const STOREFLOW_UI_MODE_KEY = 'storeflowUiMode';

function getUiLanguageMode() {
  return localStorage.getItem(STOREFLOW_UI_MODE_KEY) || 'en';
}

function setUiLanguageMode(mode) {
  if (mode !== 'en' && mode !== 'bi') mode = 'en';
  localStorage.setItem(STOREFLOW_UI_MODE_KEY, mode);
}

function toggleUiMode() {
  var current = getUiLanguageMode();
  setUiLanguageMode(current === 'en' ? 'bi' : 'en');
  location.reload();
}

// ─── Bilingual Display Labels ───────────────────────────────────────────
// Each entry: { en: 'English', bi: '中文 / English' }
// Use bilingualLabel(value) to get text for current mode.

const DISPLAY_LABELS = {
  // Categories
  '二手': { en: 'Used', bi: '二手 / Used' },
  'used': { en: 'Used', bi: '二手 / Used' },
  '新品': { en: 'New', bi: '新品 / New' },
  'new': { en: 'New', bi: '新品 / New' },
  '销售': { en: 'Sales', bi: '销售 / Sales' },
  '维修': { en: 'Repair', bi: '维修 / Repair' },
  '服务': { en: 'Service', bi: '服务 / Service' },
  '新机': { en: 'New Device', bi: '新机 / New Device' },

  // Status
  'active': { en: 'Active', bi: '启用 / Active' },
  '启用': { en: 'Active', bi: '启用 / Active' },
  'disabled': { en: 'Disabled', bi: '停用 / Disabled' },
  '停用': { en: 'Disabled', bi: '停用 / Disabled' },
  '禁用': { en: 'Disabled', bi: '停用 / Disabled' },
  'exported': { en: 'Exported', bi: '已导出 / Exported' },
  '已导出': { en: 'Exported', bi: '已导出 / Exported' },
  'not_sent': { en: 'Not Sent', bi: '未发送 / Not Sent' },
  'sent': { en: 'Sent', bi: '已发送 / Sent' },
  'failed': { en: 'Failed', bi: '发送失败 / Failed' },

  // Payment methods
  'cash': { en: 'Cash', bi: '现金 / Cash' },
  'card': { en: 'Card', bi: '刷卡 / Card' },
  'bank': { en: 'Bank', bi: '银行 / Bank' },
  'bankTransfer': { en: 'Bank Transfer', bi: '转账 / Bank Transfer' },
  'split': { en: '💳+💵', bi: '💳+💵' },

  // Order/Transaction status
  'refund': { en: 'Refund', bi: '退款 / Refund' },
  'pending': { en: 'Pending', bi: '待处理 / Pending' },
  'completed': { en: 'Completed', bi: '已完成 / Completed' },
  'received': { en: 'Received', bi: '已收货 / Received' },
  'cancelled': { en: 'Cancelled', bi: '已取消 / Cancelled' },
  '待收货': { en: 'Pending', bi: '待收货 / Pending' },
  '已收货': { en: 'Received', bi: '已收货 / Received' },
  '已取消': { en: 'Cancelled', bi: '已取消 / Cancelled' },

  // Second-hand source
  'customer': { en: 'From Customer', bi: '从客人收购 / From Customer' },
  'dealer': { en: 'From Dealer', bi: '从其他二手商人进货 / From Dealer' },
  'other': { en: 'Other', bi: '其他来源 / Other' },

  // Supplier levels
  'core': { en: 'Core', bi: '核心 / Core' },
  'normal': { en: 'Normal', bi: '普通 / Normal' },
  'temporary': { en: 'Temporary', bi: '临时 / Temporary' },

  // Stock movement types
  'entry': { en: 'Stock In', bi: '入库 / Stock In' },
  'exit': { en: 'Stock Out', bi: '出库 / Stock Out' },

  // Modal/Page titles
  'addProduct': { en: 'Add Product', bi: '新增商品 / Add Product' },
  'editProduct': { en: 'Edit Product', bi: '编辑商品 / Edit Product' },
  'addExpense': { en: 'Add Expense', bi: '新增支出 / Add Expense' },
  'createPO': { en: 'Create Purchase Order', bi: '创建采购单 / Create PO' },
};

function bilingualLabel(value, mode) {
  mode = mode || getUiLanguageMode();
  var entry = DISPLAY_LABELS[value];
  if (!entry) return value;
  return entry[mode] || entry.en || value;
}

// ─── Apply UI Mode to Static Elements ───────────────────────────────
// Elements with data-en / data-bi attributes get updated textContent.
// Call on page load after DOM ready.
function applyUiMode() {
  var mode = getUiLanguageMode();
  document.querySelectorAll('[data-en]').forEach(function(el) {
    if (mode === 'en') {
      el.textContent = el.getAttribute('data-en');
    } else {
      el.textContent = el.getAttribute('data-bi') || el.getAttribute('data-en');
    }
  });
  var toggle = document.getElementById('uiModeToggle');
  if (toggle) {
    toggle.textContent = mode === 'en' ? '中 / EN' : 'EN / 中';
  }
}

// ─── 通用工具 ────────────────────────────────────────────────────────────────

function escHtml(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showToast(msg, type) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;padding:14px 22px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.15);transform:translateX(120%);transition:transform .3s ease;max-width:400px;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = '';
  toast.style.background = type === 'error' ? '#ff3b30' : type === 'success' ? '#34c759' : '#0071e3';
  toast.style.color = '#fff';
  setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 10);
  setTimeout(() => { toast.style.transform = 'translateX(120%)'; }, 3000);
}

// ─── StoreFlow Module Access (Phase 1A — frontend helper) ─────────
// Provides canUseModule / canDo checks for hiding disabled features.
// Module list is injected by tenant branding script or set manually.
// Main POS: all modules enabled. Legacy stores: all enabled.
window.StoreFlowAccess = {
  _modules: null,
  _loaded: false,
  _plan: null,
  _storeStatus: null,
  _subscriptionStatus: null,
  _limits: null,

  init: function(payload) {
    if (!payload) return;
    if (payload.effectiveModules && Array.isArray(payload.effectiveModules)) {
      this._modules = payload.effectiveModules;
    } else if (Array.isArray(payload)) {
      this._modules = payload;
    }
    if (payload.plan) this._plan = payload.plan;
    if (payload.storeStatus) this._storeStatus = payload.storeStatus;
    if (payload.subscriptionStatus) this._subscriptionStatus = payload.subscriptionStatus;
    if (payload.limits) this._limits = payload.limits;
    this._loaded = true;
  },

  load: async function() {
    // Main POS — skip load, all modules enabled
    if (typeof window.__IS_MAIN_POS__ !== 'undefined' && window.__IS_MAIN_POS__) {
      this._loaded = true;
      return;
    }
    try {
      var r = await fetch('/api/inv/modules', { headers: { 'Accept': 'application/json' } });
      if (!r.ok) return; // Fail open — leave _modules null = all enabled
      var data = await r.json();
      this.init(data);
    } catch(_) {
      // Fail open — network error, allow all modules
    }
  },

  getEnabledModules: function() {
    // Main POS or not tenant — everything enabled
    if (typeof window.__IS_MAIN_POS__ !== 'undefined' && window.__IS_MAIN_POS__) {
      return null; // null = all enabled
    }
    // Not loaded yet — null = all enabled (fail open)
    if (!this._loaded) return null;
    return this._modules;
  },

  canUseModule: function(moduleKey) {
    var mods = this.getEnabledModules();
    // null = all enabled (Main POS or not initialized)
    if (mods === null) return true;
    // Legacy — no module list, allow all
    if (!mods || mods.length === 0) return true;
    return mods.indexOf(moduleKey) !== -1;
  },

  canDo: function(permissionKey) {
    var moduleKey = permissionKey.split('.')[0];
    return this.canUseModule(moduleKey);
  },

  getPlan: function() { return this._plan; },
  getStoreStatus: function() { return this._storeStatus; },
  getSubscriptionStatus: function() { return this._subscriptionStatus; },
  getLimits: function() { return this._limits; },
  isLoaded: function() { return this._loaded; },

  // Phase 2A — hide disabled sidebar links
  applySidebarVisibility: function() {
    var self = this;
    document.querySelectorAll('nav a[data-module]').forEach(function(link) {
      var mod = link.getAttribute('data-module');
      if (mod && !self.canUseModule(mod)) {
        link.style.display = 'none';
      }
    });
    // Hide nav-section if all following links (until next nav-section) are hidden
    document.querySelectorAll('.sidebar .nav-section').forEach(function(section) {
      var el = section.nextElementSibling;
      var hasVisible = false;
      while (el && !el.classList.contains('nav-section')) {
        if (el.tagName === 'A' && el.style.display !== 'none') hasVisible = true;
        el = el.nextElementSibling;
      }
      if (!hasVisible) section.style.display = 'none';
    });
  },

  // Phase 2A — page-level guard
  guardPage: function(moduleKey) {
    if (this.canUseModule(moduleKey)) return false; // module enabled, proceed normally
    // Module disabled — show unavailable message
    var content = document.querySelector('.content') || document.querySelector('.main') || document.body;
    if (content) {
      var msg = document.createElement('div');
      msg.style.cssText = 'text-align:center;padding:80px 24px;';
      msg.innerHTML = '<h2 style="font-size:22px;font-weight:600;margin-bottom:12px;color:#1d1d1f;">Module Not Available / 模块不可用</h2>' +
        '<p style="font-size:14px;color:#6e6e73;max-width:500px;margin:0 auto;">' +
        'This feature is not included in your current plan. Please contact your store owner or StoreFlow support.' +
        '</p><p style="font-size:14px;color:#86868b;max-width:500px;margin:16px auto;">' +
        '此功能未包含在您当前的套餐中，请联系店主或 StoreFlow 客服。' +
        '</p>';
      // Clear and show only the message, keeping sidebar/topbar
      while (content.firstChild) content.removeChild(content.firstChild);
      content.appendChild(msg);
    }
    return true; // page guarded
  }
};

// ─── Phase 2A — Auto-load module state + hide disabled sidebar ─────
// Runs after DOM ready. Fails open — no module info = all modules shown.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (function() {
    function afterLoad() {
      window.StoreFlowAccess.applySidebarVisibility();
      // Auto-apply page-level guard if body has data-page-module
      var pageModule = document.body && document.body.getAttribute('data-page-module');
      if (pageModule) {
        window.StoreFlowAccess.guardPage(pageModule);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        window.StoreFlowAccess.load().then(afterLoad);
      });
    } else {
      window.StoreFlowAccess.load().then(afterLoad);
    }
  })();
}

// ─── App version check — poll every 5 min, notify on change ───────
// Does NOT force reload. Uses passive notification only.
if (typeof window !== 'undefined') {
  (function() {
    var _appVersionCheckTimer = null;
    var _lastKnownVersion = null;

    function checkAppVersion() {
      try {
        fetch('/api/app-version', { headers: { 'Accept': 'application/json' } }).then(function(r) {
          if (!r.ok) return;
          return r.json();
        }).then(function(data) {
          if (!data || !data.version) return;
          if (_lastKnownVersion && _lastKnownVersion !== data.version) {
            // Don't notify during active POS checkout
            if (document.querySelector('.checkout-success-overlay')) return;
            if (window.invUtils && window.invUtils.showToast) {
              window.invUtils.showToast('New version available. Refresh to update.', 'info');
            }
          }
          _lastKnownVersion = data.version;
        }).catch(function() {});
      } catch (_) {}
    }

    function startVersionCheck() {
      if (_appVersionCheckTimer) return;
      checkAppVersion();
      _appVersionCheckTimer = setInterval(checkAppVersion, 5 * 60 * 1000);
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden) checkAppVersion();
      });
    }

    // Start after auth is likely ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(startVersionCheck, 10000); });
    } else {
      setTimeout(startVersionCheck, 10000);
    }
  })();
}

// Export for use in HTML pages
if (typeof window !== 'undefined') {
  window.invAuth = { getToken, getUser, isLoggedIn, requireAuth, requireAdmin, logout, isAdmin, isStaff, initPageAuth };
  window.invApi = { invFetch, authHeaders, INV_API_BASE };
  window.invUtils = { escHtml, showToast };
  window.getUiLanguageMode = getUiLanguageMode;
  window.setUiLanguageMode = setUiLanguageMode;
  window.toggleUiMode = toggleUiMode;
  window.bilingualLabel = bilingualLabel;
  window.applyUiMode = applyUiMode;
}
