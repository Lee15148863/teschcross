const mongoose = require('mongoose');

const StoreUpgradeSchema = new mongoose.Schema({
  releaseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'SaaRelease', required: true, index: true },
  storeId:        { type: mongoose.Schema.Types.ObjectId, ref: 'SaaStore' },
  deploymentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'SaaDeployment' },
  serviceName:    { type: String, required: true },
  region:         { type: String, default: 'europe-west1' },
  previousRevision: { type: String, default: '' },
  newRevision:    { type: String, default: '' },
  rollbackCommand: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'deploying', 'healthy', 'failed', 'skipped', 'rolled_back'],
    default: 'pending'
  },
  healthResult: { type: String, default: '' },
  error:        { type: String, default: '' },
  startedAt:    { type: Date },
  finishedAt:   { type: Date }
});

StoreUpgradeSchema.index({ releaseId: 1, storeId: 1 });
StoreUpgradeSchema.index({ releaseId: 1, status: 1 });

module.exports = mongoose.model('SaaStoreUpgrade', StoreUpgradeSchema);
