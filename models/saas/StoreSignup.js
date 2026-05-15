const mongoose = require('mongoose');

const StoreSignupSchema = new mongoose.Schema({
  storeName:    { type: String, required: true, trim: true },
  ownerName:    { type: String, required: true, trim: true },
  username:     { type: String, trim: true },
  password:     { type: String },
  email:        { type: String, required: true, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  country:      { type: String, trim: true },
  businessType: { type: String, trim: true },
  notes:        { type: String, trim: true },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'SaaSUser', default: null },
  reviewedAt:   { type: Date },
  createdAt:    { type: Date, default: Date.now },

  // T20/T21 — customer-owned MongoDB Atlas onboarding
  timezone:     { type: String, trim: true },
  currency:     { type: String, trim: true },
  mongoUri:     { type: String, select: false },
  mongoUriMasked: { type: String },
  mongoUriValidationStatus: { type: String, enum: ['', 'pending', 'passed', 'failed', 'error'], default: '' },
  mongoUriLastValidatedAt: { type: Date },
  deploymentPinHash: { type: String, select: false },
  pinSetAt:     { type: Date },
  subscriptionPlan: { type: String, trim: true },
  trialLengthDays: { type: Number },

  // T23 — Legal acceptance metadata
  noticeVersionAccepted:  { type: String },
  noticeAcceptedAt:       { type: Date },
  noticeAcceptedIp:       { type: String },
  noticeAcceptedUserAgent:{ type: String },
  noticeAcceptedEmail:    { type: String },
  noticeAcceptedByUsername: { type: String },

  atlasOwnershipConfirmed:      { type: Boolean, default: false },
  atlasResponsibilityAccepted:  { type: Boolean, default: false },
  storeflowConnectionAuthorised: { type: Boolean, default: false },
  legalTermsAccepted:           { type: Boolean, default: false },
  privacyNoticeAccepted:        { type: Boolean, default: false },
  dpaNoticeAccepted:            { type: Boolean, default: false },

  termsVersionAccepted:    { type: String },
  privacyVersionAccepted:  { type: String },
  dpaVersionAccepted:      { type: String },
});

module.exports = mongoose.model('StoreSignup', StoreSignupSchema);
