/* =========================
   AI CHAT MODEL
========================= */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: true });

const aiChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  messages: [messageSchema],

  /* Context for personalization */
  context: {
    currentProduct:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    shoppingGoal:     { type: String, default: '' },
    budget:           { type: Number, default: 0 },
    lastRecommended:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  },

  /* Session */
  sessionActive: { type: Boolean, default: true },
  lastActiveAt:  { type: Date, default: Date.now }

}, { timestamps: true });

/* Auto-expire inactive chats after 7 days */
aiChatSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('AIChat', aiChatSchema);
