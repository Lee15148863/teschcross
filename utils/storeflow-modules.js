/**
 * StoreFlow Module Registry
 * Defines all available feature modules for StoreFlow POS.
 * Each module maps to a set of permissions (module.action).
 *
 * Phase 1A: Foundation — registry only, not yet enforced.
 */

const STOREFLOW_MODULES = {

  // ─── Core (required, always on) ──────────────────────────────────
  pos: {
    key: 'pos',
    name: 'POS Checkout',
    category: 'core',
    required: true,
    description: 'Point of sale till, checkout, refund, discount',
    defaultVisible: true,
    permissions: ['pos.access', 'pos.checkout', 'pos.refund', 'pos.discount']
  },
  products: {
    key: 'products',
    name: 'Product Catalog',
    category: 'core',
    required: true,
    description: 'Product CRUD, categories, pricing, import',
    defaultVisible: true,
    permissions: ['products.read', 'products.create', 'products.update', 'products.delete', 'products.toggle', 'products.import']
  },
  transactions: {
    key: 'transactions',
    name: 'Transaction Records',
    category: 'core',
    required: true,
    description: 'View, search, export, delete transaction history',
    defaultVisible: true,
    permissions: ['transactions.read', 'transactions.delete', 'transactions.export', 'transactions.reprint']
  },

  // ─── Inventory ──────────────────────────────────────────────────
  stock: {
    key: 'stock',
    name: 'Stock Management',
    category: 'inventory',
    required: false,
    description: 'Stock in/out, history, alerts, reconciliation',
    defaultVisible: true,
    permissions: ['stock.read', 'stock.entry', 'stock.exit', 'stock.history', 'stock.alerts', 'stock.reconcile']
  },
  suppliers: {
    key: 'suppliers',
    name: 'Supplier Management',
    category: 'inventory',
    required: false,
    description: 'Supplier list, contacts, status, reconciliation',
    defaultVisible: false,
    permissions: ['suppliers.read', 'suppliers.create', 'suppliers.update', 'suppliers.delete', 'suppliers.reconcile']
  },
  purchases: {
    key: 'purchases',
    name: 'Purchase Orders',
    category: 'inventory',
    required: false,
    description: 'Create, receive, cancel purchase orders',
    defaultVisible: false,
    permissions: ['purchases.read', 'purchases.create', 'purchases.receive', 'purchases.cancel']
  },

  // ─── Finance ────────────────────────────────────────────────────
  expenses: {
    key: 'expenses',
    name: 'Expense Tracking',
    category: 'finance',
    required: false,
    description: 'Record, view, delete business expenses',
    defaultVisible: true,
    permissions: ['expenses.read', 'expenses.create', 'expenses.delete']
  },
  reports: {
    key: 'reports',
    name: 'Reports & Sales Visibility',
    category: 'finance',
    required: false,
    description: 'Daily summary, sales visibility, tax reports, accounting exports',
    defaultVisible: true,
    permissions: [
      'reports.access',
      'reports.dailySummary',
      'reports.salesBasic',
      'reports.salesByDateRange',
      'reports.salesByVatRateView',
      'reports.vatReportExport',
      'reports.accountingReportExport',
      'reports.profitReport',
      'reports.cashLedgerReport'
    ]
  },
  invoices: {
    key: 'invoices',
    name: 'VAT Invoices',
    category: 'finance',
    required: false,
    description: 'Generate, view, email, download VAT invoices',
    defaultVisible: false,
    permissions: ['invoices.read', 'invoices.create', 'invoices.send', 'invoices.export']
  },
  'daily-close': {
    key: 'daily-close',
    name: 'Daily Close',
    category: 'finance',
    required: false,
    description: 'End-of-day financial close and snapshots',
    defaultVisible: false,
    permissions: ['dailyclose.read', 'dailyclose.close', 'dailyclose.reopen']
  },
  'cash-reconciliation': {
    key: 'cash-reconciliation',
    name: 'Cash Reconciliation',
    category: 'finance',
    required: false,
    description: 'Cash drawer counting and reconciliation',
    defaultVisible: false,
    permissions: ['reconciliation.read', 'reconciliation.perform']
  },

  // ─── Advanced ───────────────────────────────────────────────────
  devices: {
    key: 'devices',
    name: 'Device Lifecycle',
    category: 'advanced',
    required: false,
    description: 'Buy-in, testing, repair tracking, resale lifecycle',
    defaultVisible: false,
    permissions: ['devices.read', 'devices.create', 'devices.update', 'devices.lifecycle']
  },
  whatsapp: {
    key: 'whatsapp',
    name: 'WhatsApp Messaging',
    category: 'advanced',
    required: false,
    description: 'Send receipts and updates via WhatsApp to customers',
    defaultVisible: false,
    permissions: ['whatsapp.send', 'whatsapp.read']
  },
  'customer-share': {
    key: 'customer-share',
    name: 'Customer Share Links',
    category: 'advanced',
    required: false,
    description: 'Public share links for receipts and invoices',
    defaultVisible: false,
    permissions: ['share.receipt', 'share.invoice']
  },
  shortcuts: {
    key: 'shortcuts',
    name: 'POS Shortcuts',
    category: 'advanced',
    required: false,
    description: '20-key quick-access button configuration',
    defaultVisible: true,
    permissions: ['shortcuts.read', 'shortcuts.update']
  },

  // ─── Admin ──────────────────────────────────────────────────────
  users: {
    key: 'users',
    name: 'User Management',
    category: 'admin',
    required: false,
    description: 'Create, update, disable staff accounts',
    defaultVisible: false,
    permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'users.disable']
  },
  settings: {
    key: 'settings',
    name: 'Store Settings',
    category: 'admin',
    required: false,
    description: 'VAT rates, company info, thresholds, branding',
    defaultVisible: false,
    permissions: ['settings.read', 'settings.update', 'settings.vat', 'settings.company']
  },
  audit: {
    key: 'audit',
    name: 'Audit Log',
    category: 'admin',
    required: false,
    description: 'View system audit trail',
    defaultVisible: false,
    permissions: ['audit.read']
  },
  integrations: {
    key: 'integrations',
    name: 'Integrations',
    category: 'admin',
    required: false,
    description: 'Third-party integrations and API access',
    defaultVisible: false,
    permissions: ['integrations.read', 'integrations.configure']
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────

function getAllModuleKeys() {
  return Object.keys(STOREFLOW_MODULES);
}

function getModule(moduleKey) {
  return STOREFLOW_MODULES[moduleKey] || null;
}

function getModulesByCategory(category) {
  return Object.values(STOREFLOW_MODULES).filter(function(m) {
    return m.category === category;
  });
}

function getRequiredModules() {
  return Object.values(STOREFLOW_MODULES).filter(function(m) {
    return m.required;
  });
}

function getModulePermissions(moduleKey) {
  var mod = STOREFLOW_MODULES[moduleKey];
  return mod ? mod.permissions : [];
}

function getAllPermissions() {
  var perms = [];
  Object.values(STOREFLOW_MODULES).forEach(function(m) {
    perms = perms.concat(m.permissions);
  });
  return perms;
}

module.exports = {
  STOREFLOW_MODULES,
  getAllModuleKeys,
  getModule,
  getModulesByCategory,
  getRequiredModules,
  getModulePermissions,
  getAllPermissions
};
