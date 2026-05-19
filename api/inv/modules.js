/**
 * StoreFlow Tenant Modules Endpoint — Phase 1B
 * GET /api/inv/modules
 *
 * Returns the effective module state for this tenant POS.
 * Main POS (no STOREFLOW_STORE_ID): returns all modules enabled.
 * Tenant: queries own Store document by STOREFLOW_STORE_ID.
 *
 * Purpose: frontend StoreFlowAccess.load() fetches this to know
 * which sidebar links to show and which features to enable.
 */

const express = require('express');
const router = express.Router();
const { getStoreEnabledModules, getRoleDefaultPermissions } = require('../../utils/storeflow-permissions');
const { getAllModuleKeys, getModule } = require('../../utils/storeflow-modules');
const { getPlanOrDefault } = require('../../utils/storeflow-plans');

router.get('/', async (req, res) => {
  try {
    var storeId = process.env.STOREFLOW_STORE_ID;

    // Main POS — no tenant, all modules enabled
    if (!storeId) {
      var allModules = {};
      getAllModuleKeys().forEach(function(key) {
        var mod = getModule(key);
        allModules[key] = {
          key: key,
          name: mod.name,
          category: mod.category,
          required: mod.required,
          enabled: true
        };
      });

      return res.json({
        mainPos: true,
        plan: 'main',
        storeStatus: 'active',
        subscriptionStatus: 'active',
        enabledModules: getAllModuleKeys(),
        disabledModules: [],
        effectiveModules: getAllModuleKeys(),
        modules: allModules,
        limits: {}
      });
    }

    // Tenant — load Store by STOREFLOW_STORE_ID
    var Store = require('../../models/saas/Store');
    var store = await Store.findById(storeId).lean();

    // Store not found — fail open, log warning (sanitized)
    if (!store) {
      console.warn('[inv/modules] Store not found for STOREFLOW_STORE_ID. Failing open — all modules enabled.');
      var allKeys = getAllModuleKeys();
      var fallbackMods = {};
      allKeys.forEach(function(key) {
        var mod = getModule(key);
        fallbackMods[key] = { key: key, name: mod.name, category: mod.category, required: mod.required, enabled: true };
      });

      return res.json({
        storeFound: false,
        plan: 'unknown',
        storeStatus: 'unknown',
        subscriptionStatus: 'unknown',
        enabledModules: allKeys,
        disabledModules: [],
        effectiveModules: allKeys,
        modules: fallbackMods,
        limits: {}
      });
    }

    // Store found — compute effective module state
    var plan = getPlanOrDefault(store.plan);
    var effective = getStoreEnabledModules(store);
    var disabled = store.disabledModules || [];

    var moduleDetails = {};
    getAllModuleKeys().forEach(function(key) {
      var mod = getModule(key);
      var isEnabled = effective.indexOf(key) !== -1;
      moduleDetails[key] = {
        key: key,
        name: mod.name,
        category: mod.category,
        required: mod.required,
        enabled: isEnabled
      };
    });

    res.json({
      storeFound: true,
      plan: store.plan || 'free',
      storeStatus: store.status || 'active',
      subscriptionStatus: store.subscriptionStatus || 'trialing',
      trialEndsAt: store.trialEndsAt || null,
      enabledModules: store.enabledModules || [],
      disabledModules: disabled,
      effectiveModules: effective,
      modules: moduleDetails,
      limits: plan.limits || {}
    });

  } catch (e) {
    // Fail open — log only safe message
    console.error('[inv/modules] Error loading modules. Failing open:', e.message);
    var keys = getAllModuleKeys();
    return res.json({
      storeFound: false,
      error: 'LOAD_FAILED',
      plan: 'unknown',
      storeStatus: 'unknown',
      subscriptionStatus: 'unknown',
      enabledModules: keys,
      disabledModules: [],
      effectiveModules: keys,
      modules: {},
      limits: {}
    });
  }
});

module.exports = router;
