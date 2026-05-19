/**
 * StoreFlow Tenant Modules Endpoint — Phase 1C
 * GET /api/inv/modules
 *
 * Returns the effective module state for this tenant POS.
 * Priority: env entitlement → DB lookup → fail-open all modules.
 *
 * Purpose: frontend StoreFlowAccess.load() fetches this to know
 * which sidebar links to show and which features to enable.
 */

const express = require('express');
const router = express.Router();
const { getAllModuleKeys, getModule } = require('../../utils/storeflow-modules');

function buildModuleDetails(enabledKeys) {
  var details = {};
  var enabledSet = {};
  (enabledKeys || []).forEach(function(k) { enabledSet[k] = true; });

  getAllModuleKeys().forEach(function(key) {
    var mod = getModule(key);
    details[key] = {
      key: key,
      name: mod.name,
      category: mod.category,
      required: mod.required,
      enabled: !!enabledSet[key]
    };
  });
  return details;
}

function allModulesResponse(source) {
  var keys = getAllModuleKeys();
  return {
    mainPos: !process.env.STOREFLOW_STORE_ID,
    entitlementSource: source,
    plan: process.env.STOREFLOW_STORE_ID ? 'unknown' : 'main',
    storeStatus: 'active',
    subscriptionStatus: 'active',
    enabledModules: keys,
    disabledModules: [],
    effectiveModules: keys,
    modules: buildModuleDetails(keys),
    limits: {}
  };
}

router.get('/', function(req, res) {
  try {
    var storeId = process.env.STOREFLOW_STORE_ID;

    // 1. Main POS — no tenant, all modules enabled
    if (!storeId) {
      return res.json(allModulesResponse('main'));
    }

    // 2. Phase 1C: env-based entitlement (preferred, avoids cross-DB query)
    var envModules = process.env.STOREFLOW_ENABLED_MODULES;
    if (envModules) {
      var parsedModules = envModules.split(',').map(function(s) { return s.trim(); }).filter(Boolean);

      // Filter to known modules only
      var validModules = parsedModules.filter(function(k) { return !!getModule(k); });

      // Parse limits
      var limits = {};
      try {
        var rawLimits = process.env.STOREFLOW_LIMITS_JSON;
        if (rawLimits) limits = JSON.parse(rawLimits);
      } catch (_) {
        limits = {};
      }

      return res.json({
        mainPos: false,
        entitlementSource: 'env',
        plan: process.env.STOREFLOW_PLAN || 'free',
        storeStatus: 'active',
        subscriptionStatus: 'active',
        enabledModules: validModules,
        disabledModules: [],
        effectiveModules: validModules,
        modules: buildModuleDetails(validModules),
        limits: limits,
        moduleSchemaVersion: process.env.STOREFLOW_MODULE_SCHEMA_VERSION || '1'
      });
    }

    // 3. Legacy: try DB lookup (legacy tenants without env entitlement)
    // Note: this only works when tenant DB shares connection with SaaS admin DB.
    // For most tenants, this will fall through to fail-open below.
    try {
      var Store = require('../../models/saas/Store');
      Store.findById(storeId).lean().then(function(store) {
        if (!store) {
          console.warn('[inv/modules] Store not found for STOREFLOW_STORE_ID. Failing open.');
          return res.json(allModulesResponse('legacy-fail-open'));
        }

        var effective = require('../../utils/storeflow-permissions').getStoreEnabledModules(store);
        var plan = require('../../utils/storeflow-plans').getPlanOrDefault(store.plan);

        res.json({
          mainPos: false,
          entitlementSource: 'db',
          storeFound: true,
          plan: store.plan || 'free',
          storeStatus: store.status || 'active',
          subscriptionStatus: store.subscriptionStatus || 'trialing',
          trialEndsAt: store.trialEndsAt || null,
          enabledModules: store.enabledModules || getAllModuleKeys(),
          disabledModules: store.disabledModules || [],
          effectiveModules: effective,
          modules: buildModuleDetails(effective),
          limits: plan.limits || {}
        });
      }).catch(function(e) {
        console.warn('[inv/modules] DB lookup failed. Failing open:', e.message);
        res.json(allModulesResponse('legacy-fail-open'));
      });
      return; // async path handled by promise chain above
    } catch (_) {
      // DB model not available — fail open
    }

    // 4. Fail open — no env, no DB
    return res.json(allModulesResponse('legacy-fail-open'));

  } catch (e) {
    console.error('[inv/modules] Error:', e.message);
    return res.json(allModulesResponse('error'));
  }
});

module.exports = router;
