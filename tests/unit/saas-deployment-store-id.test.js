/**
 * Deployment.storeId migration tests.
 * Tests model field, freezeGate preference, and legacy fallback.
 */

const mongoose = require('mongoose');

describe('Deployment.storeId schema', () => {
  let Deployment;

  beforeAll(async () => {
    Deployment = require('../../models/saas/Deployment');
  });

  it('has storeId field as optional ObjectId', () => {
    const schema = Deployment.schema;
    const storeId = schema.paths['storeId'];
    expect(storeId).toBeDefined();
    expect(storeId.instance).toBe('ObjectId');
    expect(storeId.options.ref).toBe('SaaStore');
    expect(storeId.options.index).toBe(true);
  });

  it('does not require storeId (legacy compatibility)', () => {
    const schema = Deployment.schema;
    const storeId = schema.paths['storeId'];
    expect(storeId).toBeDefined();
    expect(storeId.isRequired).toBeFalsy();
  });

  it('storeName still required', () => {
    const schema = Deployment.schema;
    const storeName = schema.paths['storeName'];
    expect(storeName).toBeDefined();
    expect(storeName.isRequired).toBe(true);
  });
});
