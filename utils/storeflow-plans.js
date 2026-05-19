/**
 * StoreFlow Plan Registry
 * Defines subscription tiers and their feature access.
 *
 * Phase 1A: Foundation — registry only. Plans are enforced
 * via storeflow-permissions.js when store.enabledModules is set.
 */

const STOREFLOW_PLANS = {

  free: {
    key: 'free',
    name: 'Free',
    description: 'Basic POS for single-user repair shops',
    allowedModules: [
      'pos', 'products', 'transactions',
      'stock', 'shortcuts'
    ],
    defaultEnabledModules: [
      'pos', 'products', 'transactions',
      'stock', 'shortcuts'
    ],
    limits: {
      users: 1,
      products: 50,
      monthlyTransactions: 100,
      stores: 1
    },
    features: {
      reports: false,
      invoices: false,
      devices: false,
      whatsapp: false,
      customerShare: false,
      apiAccess: false
    },
    price: { monthly: 0, annual: 0 },
    notes: 'One user. Up to 50 products. 100 transactions/month. Basic POS only.'
  },

  starter: {
    key: 'starter',
    name: 'Starter',
    description: 'Full POS for small repair businesses',
    allowedModules: [
      'pos', 'products', 'transactions', 'stock',
      'expenses', 'reports', 'invoices',
      'suppliers', 'purchases', 'daily-close',
      'shortcuts', 'whatsapp', 'customer-share'
    ],
    defaultEnabledModules: [
      'pos', 'products', 'transactions', 'stock',
      'expenses', 'reports', 'invoices',
      'suppliers', 'purchases', 'daily-close',
      'shortcuts', 'whatsapp', 'customer-share'
    ],
    limits: {
      users: 3,
      products: 500,
      monthlyTransactions: 2000,
      stores: 1
    },
    features: {
      reports: true,
      invoices: true,
      devices: false,
      whatsapp: true,
      customerShare: true,
      apiAccess: false
    },
    price: { monthly: 29, annual: 290 },
    notes: 'Up to 3 staff. Full POS with reports and VAT invoices. WhatsApp messaging. One store.'
  },

  pro: {
    key: 'pro',
    name: 'Professional',
    description: 'Advanced features for growing repair chains',
    allowedModules: [
      'pos', 'products', 'transactions', 'stock',
      'expenses', 'reports', 'invoices', 'suppliers', 'purchases',
      'daily-close', 'cash-reconciliation', 'devices',
      'whatsapp', 'customer-share',
      'shortcuts', 'users', 'settings'
    ],
    defaultEnabledModules: [
      'pos', 'products', 'transactions', 'stock',
      'expenses', 'reports', 'invoices', 'suppliers', 'purchases',
      'daily-close', 'cash-reconciliation', 'devices',
      'whatsapp', 'customer-share',
      'shortcuts', 'users', 'settings'
    ],
    limits: {
      users: 10,
      products: 5000,
      monthlyTransactions: 20000,
      stores: 3
    },
    features: {
      reports: true,
      invoices: true,
      devices: true,
      whatsapp: true,
      customerShare: true,
      apiAccess: false,
      advancedReports: true,
      csvImport: true
    },
    price: { monthly: 79, annual: 790 },
    notes: 'Up to 10 staff. Multi-store (3). Device lifecycle. Advanced reports. CSV import.'
  },

  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited everything for large chains',
    allowedModules: [
      'pos', 'products', 'transactions', 'stock',
      'expenses', 'reports', 'invoices', 'suppliers', 'purchases',
      'daily-close', 'cash-reconciliation', 'devices',
      'whatsapp', 'customer-share',
      'shortcuts', 'users', 'settings', 'audit', 'integrations'
    ],
    defaultEnabledModules: [
      'pos', 'products', 'transactions', 'stock',
      'expenses', 'reports', 'invoices', 'suppliers', 'purchases',
      'daily-close', 'cash-reconciliation', 'devices',
      'whatsapp', 'customer-share',
      'shortcuts', 'users', 'settings', 'audit', 'integrations'
    ],
    limits: {
      users: 50,
      products: 50000,
      monthlyTransactions: 100000,
      stores: 20
    },
    features: {
      reports: true,
      invoices: true,
      devices: true,
      whatsapp: true,
      customerShare: true,
      apiAccess: true,
      advancedReports: true,
      csvImport: true,
      prioritySupport: true,
      customBranding: true
    },
    price: { monthly: 199, annual: 1990 },
    notes: 'Unlimited staff. 20 stores. API access. Priority support. Custom branding.'
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────

function getPlan(planKey) {
  return STOREFLOW_PLANS[planKey] || null;
}

function getPlanOrDefault(planKey) {
  return STOREFLOW_PLANS[planKey] || STOREFLOW_PLANS.enterprise;
}

function getAllPlanKeys() {
  return Object.keys(STOREFLOW_PLANS);
}

function getPlanAllowedModules(planKey) {
  var plan = getPlan(planKey);
  return plan ? plan.allowedModules.slice() : [];
}

function getPlanDefaultModules(planKey) {
  var plan = getPlan(planKey);
  return plan ? plan.defaultEnabledModules.slice() : [];
}

function getPlanLimits(planKey) {
  var plan = getPlanOrDefault(planKey);
  return plan.limits || {};
}

function isModuleAllowedByPlan(planKey, moduleKey) {
  var plan = getPlan(planKey);
  if (!plan) return true;  // unknown plan → allow all (fail open)
  return plan.allowedModules.includes(moduleKey);
}

module.exports = {
  STOREFLOW_PLANS,
  getPlan,
  getPlanOrDefault,
  getAllPlanKeys,
  getPlanAllowedModules,
  getPlanDefaultModules,
  getPlanLimits,
  isModuleAllowedByPlan
};
