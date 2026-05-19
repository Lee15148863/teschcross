const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  ownerName:    { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  country:      { type: String, trim: true },
  businessType: { type: String, trim: true },
  notes:        { type: String, trim: true },

  // Store display settings (from dashboard)
  logo:       { type: String },
  address:    { type: String, trim: true },
  vatNumber:  { type: String, trim: true },
  receiptTC:  { type: String, trim: true },

  status:      { type: String, enum: ['active', 'suspended', 'frozen', 'pending'], default: 'pending' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'SaaSUser', default: null },
  approvedAt:  { type: Date },

  // T20/T21 — timezone and currency from signup, no mongoUri here
  timezone:    { type: String, trim: true },
  currency:    { type: String, trim: true },

  // ─── StoreFlow Module / Plan / Permission (Phase 1A) ──────────
  // Backward compatible: undefined = legacy all-enabled mode
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'canceled', 'expired', 'none'],
    default: 'trialing'
  },
  trialEndsAt: { type: Date },

  // Module control
  // undefined → legacy (all modules available)
  // [] → no modules (should not happen — required modules always on)
  // ['pos','products','transactions',...] → explicit
  enabledModules:  { type: [String], default: undefined },
  disabledModules: { type: [String], default: [] },

  // Per-store feature overrides (free-form)
  featureOverrides: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

  // Custom limits overriding plan defaults
  limits: { type: Map, of: Number, default: {} },

  // ─── Database Hosting (StoreFlow Phase 3A) ──────────
  databaseMode: {
    type: String,
    enum: ['managed', 'byo'],
    default: 'managed'
  },
  // Managed mode: auto-generated DB name on shared cluster
  managedDbName: { type: String, trim: true },
  // Storage tracking (soft limits, not enforced yet)
  storageLimitMB:  { type: Number, default: 50 },
  storageUsedMB:   { type: Number, default: 0 },
  storageLastCheckedAt: { type: Date },
  // BYO mode (future: Secret Manager reference, never raw URI)
  byoMongoConfigured:  { type: Boolean, default: false },
  byoMongoSecretName:  { type: String },
  byoMongoSecretVersion: { type: String },
  byoMongoVerifiedAt:  { type: Date },
  byoMongoDbName:      { type: String },
  // Backup & data control (plan-dependent)
  backupPolicy:   { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
  lastBackupAt:   { type: Date },
  dataRegion:     { type: String, default: 'europe-west1' },
  allowDataExport: { type: Boolean, default: false },

  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
});

StoreSchema.index({ email: 1 });
StoreSchema.index({ status: 1 });

module.exports = mongoose.model('SaaStore', StoreSchema);
