const mongoose = require('mongoose');

const DeploymentAuditSchema = new mongoose.Schema({
  deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaaDeployment', required: true },
  storeName:    { type: String },
  serviceName:  { type: String },
  action:       { type: String, required: true },
  result:       { type: String, enum: ['success', 'failed'], required: true },
  reason:       { type: String },
  details:      { type: mongoose.Schema.Types.Mixed },
  adminUser:    { type: String },
  adminName:    { type: String },
  snapshot:     { type: mongoose.Schema.Types.Mixed },
  createdAt:    { type: Date, default: Date.now }
});

DeploymentAuditSchema.index({ deploymentId: 1, createdAt: -1 });
DeploymentAuditSchema.index({ action: 1 });

module.exports = mongoose.model('SaaDeploymentAudit', DeploymentAuditSchema);
