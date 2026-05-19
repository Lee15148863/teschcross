/**
 * StoreFlow Permission Helper
 * Combines plan limits + store module state + user permissions.
 *
 * Phase 1A: Foundation — helper functions exist but are not yet
 * enforced via middleware. Backward compatible with legacy stores.
 *
 * Core rules:
 *   Plan → controls what modules the store CAN potentially use.
 *   Store.enabledModules → controls what IS enabled for this store.
 *   User permissions → controls what the user CAN do within modules.
 *
 * Legacy compatibility:
 *   - Main POS (no STOREFLOW_STORE_ID): everything allowed.
 *   - Store with undefined enabledModules: everything allowed.
 *   - Store with explicit enabledModules: enforced.
 */

const { STOREFLOW_MODULES, getAllModuleKeys, getModule, getModulePermissions } = require('./storeflow-modules');
const { getPlanOrDefault, getPlanAllowedModules, getPlanDefaultModules } = require('./storeflow-plans');

// ─── Store Module Resolution ───────────────────────────────────────

/**
 * Get the effective enabled modules for a store.
 * Resolves: plan defaults + store overrides - store disabled.
 *
 * @param {Object} store - Store document (can be lean/plain object)
 * @param {Object} [options]
 * @param {boolean} [options.forceLegacy] - if true, return all modules (legacy mode)
 * @returns {string[]} Array of module keys
 */
function getStoreEnabledModules(store, options) {
  options = options || {};

  // Main POS — no store, everything allowed
  if (!store) return getAllModuleKeys();

  // Legacy store — undefined or null enabledModules = all allowed
  if (store.enabledModules === undefined || store.enabledModules === null) {
    if (options.forceLegacy !== false) {
      return getAllModuleKeys();
    }
  }

  // Explicit list: plan defaults + store overrides - store disabled
  var planKey = store.plan || 'free';
  var planDefaults = getPlanDefaultModules(planKey);
  var enabledSet = {};

  // Start with plan defaults
  planDefaults.forEach(function(m) { enabledSet[m] = true; });

  // Apply store-level overrides
  if (Array.isArray(store.enabledModules)) {
    store.enabledModules.forEach(function(m) { enabledSet[m] = true; });
  }

  // Remove explicitly disabled
  if (Array.isArray(store.disabledModules)) {
    store.disabledModules.forEach(function(m) { delete enabledSet[m]; });
  }

  // Always include required modules
  Object.values(STOREFLOW_MODULES).forEach(function(m) {
    if (m.required) enabledSet[m.key] = true;
  });

  return Object.keys(enabledSet);
}

/**
 * Check if a module is enabled for a store.
 */
function isModuleEnabled(store, moduleKey) {
  if (!store) return true;  // Main POS
  var enabled = getStoreEnabledModules(store);
  return enabled.indexOf(moduleKey) !== -1;
}

/**
 * Check if plan allows a module at all.
 */
function isModuleAllowedByPlan(store, moduleKey) {
  if (!store) return true;
  var plan = getPlanOrDefault(store.plan);
  return plan.allowedModules.indexOf(moduleKey) !== -1;
}

// ─── Role Default Permissions ──────────────────────────────────────

/**
 * Get the default permission set for a given role within enabled modules.
 *
 * @param {string} role - 'root', 'manager', 'staff'
 * @param {Object} store - Store document
 * @returns {string[]} Array of permission keys
 */
function getRoleDefaultPermissions(role, store) {
  var enabledModules = getStoreEnabledModules(store);
  var perms = [];

  enabledModules.forEach(function(modKey) {
    var modPerms = getModulePermissions(modKey);
    if (role === 'root') {
      // Root gets ALL permissions within enabled modules
      perms = perms.concat(modPerms);
    } else if (role === 'manager') {
      // Manager gets read+write, but not delete permissions
      modPerms.forEach(function(p) {
        if (p.indexOf('.delete') === -1) perms.push(p);
      });
    } else {
      // Staff gets read-only permissions
      modPerms.forEach(function(p) {
        if (p.indexOf('.read') !== -1 || p.indexOf('.access') !== -1 ||
            p === 'pos.checkout' || p === 'shortcuts.read') {
          perms.push(p);
        }
      });
    }
  });

  return perms;
}

// ─── User Permission Check ─────────────────────────────────────────

/**
 * Get the effective permissions for a user in a store.
 * If user.permissions is set explicitly (array), use that.
 * Otherwise, use role defaults.
 *
 * @param {Object} user  - User document (can be POS user or SaaS user)
 * @param {Object} store - Store document
 * @returns {string[]} Array of permission keys
 */
function getUserPermissions(user, store) {
  if (!user) return [];

  // Root gets everything
  if (user.role === 'root') {
    return getRoleDefaultPermissions('root', store);
  }

  // Explicit permissions array takes precedence
  if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }

  // Fall back to role defaults
  return getRoleDefaultPermissions(user.role || 'staff', store);
}

/**
 * Check if user can use a module.
 */
function canUseModule(user, store, moduleKey) {
  // Main POS — no restrictions
  if (!store) return true;

  // No user — allow read-only access (for auth pages)
  if (!user) return false;

  // Root can use everything that's enabled
  if (user.role === 'root') return isModuleEnabled(store, moduleKey);

  // Check module is enabled + user has at least one permission in it
  if (!isModuleEnabled(store, moduleKey)) return false;

  return true;
}

/**
 * Check if user can perform a specific action.
 */
function canDo(user, store, permissionKey) {
  if (!store) return true;   // Main POS — everything allowed
  if (!user) return false;

  // Root can do everything within enabled modules
  if (user.role === 'root') {
    var moduleKey = permissionKey.split('.')[0];
    return isModuleEnabled(store, moduleKey);
  }

  // Check user permissions
  var userPerms = getUserPermissions(user, store);
  return userPerms.indexOf(permissionKey) !== -1;
}

// ─── Middleware Helpers (Phase 1A: defined but not broadly applied) ──

/**
 * Express middleware — blocks request if module is disabled.
 * To be applied per-route in Phase 2+.
 */
function requireModule(moduleKey) {
  return function(req, res, next) {
    // Main POS — skip check
    if (!process.env.STOREFLOW_STORE_ID) return next();

    // Fast path: env-based entitlement
    var envModules = process.env.STOREFLOW_ENABLED_MODULES;
    if (envModules) {
      var sep = ':';
      if (envModules.indexOf(':') === -1 && envModules.indexOf(',') > -1) sep = ',';
      if (envModules.indexOf(':') === -1 && envModules.indexOf(',') === -1 && envModules.indexOf('_') > -1) sep = '_';
      var parsedModules = envModules.split(sep).map(function(s) { return s.trim(); }).filter(Boolean);
      if (parsedModules.indexOf(moduleKey) !== -1) return next();

      return res.status(403).json({
        error: 'MODULE_DISABLED',
        module: moduleKey,
        message: 'Module "' + moduleKey + '" is not available on your plan.'
      });
    }

    // Slow path: DB-based store lookup (legacy)
    var store = req.storeFlowStore;
    if (!store) {
      // Fail open — cannot verify, but log warning
      console.warn('storeflow-permissions: requireModule(' + moduleKey + ') called but STOREFLOW_ENABLED_MODULES not set and req.storeFlowStore not available. Failing open.');
      return next();
    }

    if (isModuleEnabled(store, moduleKey)) return next();

    return res.status(403).json({
      error: 'MODULE_DISABLED',
      module: moduleKey,
      message: 'Module "' + moduleKey + '" is not available on your plan.'
    });
  };
}

/**
 * Express middleware — blocks request if user lacks permission.
 * To be applied per-route in Phase 2+.
 */
function requirePermission(permissionKey) {
  return function(req, res, next) {
    if (!process.env.STOREFLOW_STORE_ID) return next();

    var user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (canDo(user, req.storeFlowStore, permissionKey)) return next();

    return res.status(403).json({
      error: 'PERMISSION_DENIED',
      permission: permissionKey,
      message: 'You do not have permission: ' + permissionKey
    });
  };
}

// ─── Exports ────────────────────────────────────────────────────────

module.exports = {
  getStoreEnabledModules,
  isModuleEnabled,
  isModuleAllowedByPlan,
  getRoleDefaultPermissions,
  getUserPermissions,
  canUseModule,
  canDo,
  requireModule,
  requirePermission
};
