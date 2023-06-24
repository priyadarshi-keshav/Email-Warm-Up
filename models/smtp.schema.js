const mongoose = require("mongoose")

const smtpSchema = new mongoose.Schema({
  userId: { type: String },

  provider: { type: String, required: true, enum: ["gmail", "yahoo", "outlook", "custom"] },

  senderName: { type: String },

  senderEmail: { type: String },

  userName: { type: String },

  password: { type: String },

  smtpHost: { type: String },

  imapHost: { type: String },

  smtpPort: { type: String },

  imapPort: { type: String },

  ssl: { type: String },

  twoFaEnabled: { type: Boolean, required: false, default: false },

  imapEnabled: { type: Boolean, required: false, default: false },

  isWarmupActive: { type: Boolean, required: false, default: false },

  warmupEmailSent: { type: Boolean, required: false, default: false },

  isDisconnectedEmailSent: { type: Boolean, required: false, default: false },

  isDisconnected: { type: Boolean, required: true, default: false },

  appPasswordCreated: { type: Boolean, required: false, default: false },

  pickedForTheDay: { type: Boolean, default: false },

  lastSyncTime: { type: Date, default: new Date() }

}, {
  timestamps: true
})

const SMTP = mongoose.model('Smtp', smtpSchema);

module.exports = SMTP;