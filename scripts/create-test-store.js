/**
 * create-test-store.js — Create StoreFlow Test Shop
 *
 * Creates Store + SaaSUser + Deployment records directly.
 * This is an INTERNAL test store, NOT a real customer.
 *
 * Run: node scripts/create-test-store.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const TEST_STORE = {
  storeName:    'StoreFlow Test Shop',
  ownerName:    'Test Owner',
  username:     'test_owner',
  password:     'testpass123',
  email:        'test-owner@storeflow.local',
  phone:        '0000000000',
  country:      'Ireland',
  businessType: 'mixed_retail_repair',
  timezone:     'Europe/Dublin',
  deployPin:    '4825',
  notes:        'Internal functional testing store only. NOT a real customer.',
  mongoUri:     process.env.TEST_MONGO_URI || 'mongodb+srv://placeholder:storeflow-test@cluster0.storeflowtest.mongodb.net/storeflow_test_shop'
};

async function main() {
  await mongoose.connect(process.env.DBCon, { dbName: 'techcross' });
  console.log('✓ Connected to MongoDB');

  const SaaSUser = require('../models/saas/SaaSUser');
  const Store = require('../models/saas/Store');
  const Deployment = require('../models/saas/Deployment');

  // 1. Delete any previous test store artifacts (idempotent)
  const prevUser = await SaaSUser.findOne({ username: TEST_STORE.username });
  if (prevUser) {
    await SaaSUser.deleteOne({ username: TEST_STORE.username });
    console.log('  Cleaned up previous test user');
  }
  const prevStore = await Store.findOne({ name: TEST_STORE.storeName });
  if (prevStore) {
    await Deployment.deleteMany({ storeName: TEST_STORE.storeName });
    await Store.deleteOne({ name: TEST_STORE.storeName });
    console.log('  Cleaned up previous test store + deployments');
  }

  // 2. Create Store
  const store = await Store.create({
    name:         TEST_STORE.storeName,
    ownerName:    TEST_STORE.ownerName,
    email:        TEST_STORE.email,
    phone:        TEST_STORE.phone,
    country:      TEST_STORE.country,
    businessType: TEST_STORE.businessType,
    notes:        TEST_STORE.notes,
    status:       'active',
    approvedBy:   null,
    approvedAt:   new Date()
  });
  console.log('✓ Store created: ' + store.name + ' (' + store._id + ')');

  // 3. Create store_root user
  const hashedPw = await bcrypt.hash(TEST_STORE.password, 10);
  const user = await SaaSUser.create({
    username:    TEST_STORE.username,
    password:    hashedPw,
    displayName: TEST_STORE.ownerName,
    email:       TEST_STORE.email,
    role:        'store_root',
    storeId:     store._id,
    active:      true
  });
  console.log('✓ Store owner created: ' + user.username);

  // 4. Create Deployment record (no actual Cloud Run deploy)
  const pinHash = await bcrypt.hash(TEST_STORE.deployPin, 10);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const dep = await Deployment.create({
    storeName:    TEST_STORE.storeName,
    subdomain:    'storeflow-test',
    serviceName:  'storeflow-test',
    mongoUri:     TEST_STORE.mongoUri,
    status:       'running',
    pinHash:      pinHash,
    pinSetAt:     new Date(),
    timezone:     TEST_STORE.timezone,
    env:          { STORE_TYPE: 'test', STORE_NOTES: TEST_STORE.notes },
    subscriptionStatus:    'trial',
    subscriptionExpiresAt: expiresAt,
    gracePeriodDays:       7,
    cloudRunUrl:  '',
    version:      '0.0.0'
  });
  console.log('✓ Deployment record created: ' + dep.serviceName);
  console.log('  Subscription expires: ' + expiresAt.toISOString().slice(0, 10));

  // Summary
  console.log('\n========================================');
  console.log('STOREFLOW TEST SHOP READY');
  console.log('========================================');
  console.log('Store:        ' + TEST_STORE.storeName);
  console.log('Username:     ' + TEST_STORE.username);
  console.log('Password:     ' + TEST_STORE.password);
  console.log('Deploy PIN:   ' + TEST_STORE.deployPin);
  console.log('Timezone:     ' + TEST_STORE.timezone);
  console.log('Login URL:    http://localhost:8080/saas/login.html');
  console.log('Dashboard:    http://localhost:8080/saas/dashboard.html');
  console.log('');
  console.log('Super admin login for Lee087:');
  console.log('  Username: Lee087');
  console.log('  Password: O87o9o8555HL');
  console.log('  Admin:    http://localhost:8080/saas/admin.html');
  console.log('  Deploy:   http://localhost:8080/saas/admin-deployments.html');
  console.log('');

  await mongoose.disconnect();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
