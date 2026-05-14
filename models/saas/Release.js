const mongoose = require('mongoose');

const ReleaseSchema = new mongoose.Schema({
  version:       { type: String, required: true, trim: true },
  gitCommit:     { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'testing', 'test_passed', 'rolling_out', 'completed', 'failed', 'rolled_back'],
    default: 'draft'
  },

  testDeploymentId:     { type: String },
  testServiceName:      { type: String },
  testPreviousRevision: { type: String },
  testNewRevision:      { type: String },
  testResult:           { type: String, default: '' },

  createdBy:   { type: String },
  createdAt:   { type: Date, default: Date.now },
  approvedBy:  { type: String },
  approvedAt:  { type: Date },
  rolloutStartedAt:  { type: Date },
  rolloutFinishedAt: { type: Date },

  notes: { type: String, default: '' }
});

ReleaseSchema.index({ status: 1 });
ReleaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SaaRelease', ReleaseSchema);
