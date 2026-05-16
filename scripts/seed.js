/**
 * TECH CROSS MAIN SITE ONLY — Website Repair Pricing Seed Script.
 *
 * WARNING:
 *   This script seeds the techcross main website repair pricing data ONLY.
 *   It must NEVER be run against a StoreFlow tenant (customer) database.
 *   StoreFlow tenants start with clean, empty databases.
 *   See STORE_FLOW_TENANT_RULES.md for the clean tenant policy.
 *
 *   NOT called by:
 *     - deploy-tenant-store.js
 *     - api/saas/stores.js
 *     - api/saas/releases.js
 *     - scripts/bootstrap-users.js
 *     - any StoreFlow onboarding or deploy flow
 *
 *   Hardcoded to dbName: 'techcross'.
 *   Run: node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Guard: refuse to run if STORE_NAME overrides are set (anti-tenant-seed protection)
const targetDb = process.env.STORE_NAME || 'techcross';
if (targetDb !== 'techcross') {
  console.error('BLOCKED: seed.js is for TechCross main site only.');
  console.error('STORE_NAME=' + targetDb + ' is not allowed.');
  console.error('See STORE_FLOW_TENANT_RULES.md — StoreFlow tenants must start clean.');
  process.exit(1);
}
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Pricing = require('../models/Pricing');

// Simulate browser localStorage
const localStorageStore = {};
const mockLocalStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = v; },
    removeItem: (k) => { delete localStorageStore[k]; }
};

// Create a sandbox context that all pricing files share
const sandbox = {
    localStorage: mockLocalStorage,
    console,
    Date,
    JSON,
};
vm.createContext(sandbox);

// Load a pricing JS file into the shared sandbox
function loadFile(filename) {
    const code = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    vm.runInContext(code, sandbox);
}

// Load all pricing data files
const files = [
    'pricing-data-apple.js',
    'pricing-data-samsung.js',
    'pricing-data.js',
    'pricing-data-xiaomi.js',
    'pricing-data-google.js',
    'pricing-data-oneplus.js',
    'pricing-data-oppo.js',
    'pricing-data-huawei.js',
    'pricing-data-honor.js',
    'pricing-data-other.js',
];
files.forEach(loadFile);

async function seed() {
    await mongoose.connect(process.env.DBCon, { dbName: 'techcross' });
    console.log('✅ Connected to MongoDB');

    const brands = [
        { brand: 'apple',   getData: () => sandbox.loadApplePricingData() },
        { brand: 'samsung', getData: () => sandbox.loadSamsungPricingData() },
        { brand: 'xiaomi',  getData: () => sandbox.loadXiaomiPricingData() },
        { brand: 'google',  getData: () => sandbox.loadGooglePricingData() },
        { brand: 'oneplus', getData: () => sandbox.loadOnePlusPricingData() },
        { brand: 'oppo',    getData: () => sandbox.loadOppoPricingData() },
        { brand: 'huawei',  getData: () => sandbox.loadHuaweiPricingData() },
        { brand: 'honor',   getData: () => sandbox.loadHonorPricingData() },
        { brand: 'other',   getData: () => sandbox.loadOtherPricingData() },
        { brand: 'multi',   getData: () => sandbox.loadPricingData() },
    ];

    for (const { brand, getData } of brands) {
        const data = getData();
        await Pricing.findOneAndUpdate(
            { brand },
            { data, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        console.log(`  ✓ Seeded: ${brand}`);
    }

    console.log('\n🎉 All pricing data seeded to MongoDB!');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
