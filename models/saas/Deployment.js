const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  version:      { type: String },
  imageTag:     { type: String },
  gitCommit:    { type: String },
  releaseNotes: { type: String },
  buildId:      { type: String },
  deployedAt:   { type: Date, default: Date.now },
  deployedBy:   { type: String },
  status:       { type: String, enum: ['success', 'failed', 'deploying'] },
  revisionName: { type: String },
  dockerImage:  { type: String }
}, { _id: true });

const DeploymentSchema = new mongoose.Schema({
  storeName:    { type: String, required: true, trim: true },
  storeId:      { type: mongoose.Schema.Types.ObjectId, ref: 'SaaStore', index: true },
  subdomain:    { type: String, required: true, trim: true },
  serviceName:  { type: String, required: true, unique: true, trim: true },
  mongoUri:     { type: String, select: false },
  status:       { type: String, enum: ['pending', 'deploying', 'running', 'suspended', 'failed', 'readonly_frozen'], default: 'pending' },
  env:          { type: Map, of: String, default: {} },
  pinHash:      { type: String, default: '' },
  pinSetAt:     { type: Date },
  timezone:     { type: String, default: 'Europe/Dublin' },

  cloudRunUrl:  { type: String },
  imageTag:     { type: String },
  gitCommit:    { type: String },
  buildId:      { type: String },
  version:      { type: String },
  deployedAt:   { type: Date },
  deployedBy:   { type: String },
  error:        { type: String },

  versions:     [VersionSchema],

  subscriptionStatus:  { type: String, enum: ['trial', 'active', 'expired', 'readonly_frozen', 'suspended', 'deleted'], default: 'trial' },
  subscriptionStart:    { type: Date, default: Date.now },
  subscriptionExpiresAt: { type: Date },
  gracePeriodDays:      { type: Number, default: 7 },

  // T20/T21 — URI validation metadata
  mongoUriMasked:       { type: String },
  mongoUriValidationStatus: { type: String, enum: ['', 'pending', 'passed', 'failed', 'error'], default: '' },
  mongoUriLastValidatedAt: { type: Date },
  mongoUriUpdatedAt:    { type: Date },
  atlasOwnershipConfirmed: { type: Boolean, default: false },

  // T21c — Secret Manager integration
  mongoUriStorageMode: { type: String, enum: ['', 'plaintext_admin_db', 'secret_manager'], default: '' },
  mongoUriSecretName:  { type: String },
  mongoUriSecretVersion: { type: String },
  secretLastUpdatedAt: { type: Date },

  lastHealthCheck:          { type: Date },
  lastSuccessfulHealthCheck: { type: Date },
  lastHealthStatus:         { type: String, default: 'unknown' },
  lastMongoStatus:          { type: Number },
  healthLatency:            { type: Number },
  lastHealthError:          { type: String },

  lastRestartAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Only index on status + subscription — unique index on serviceName is auto from `unique: true`
DeploymentSchema.index({ status: 1 });
DeploymentSchema.index({ subscriptionStatus: 1, subscriptionExpiresAt: 1 });

module.exports = mongoose.model('SaaDeployment', DeploymentSchema);
