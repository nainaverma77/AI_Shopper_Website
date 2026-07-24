/* =========================
   NOTIFICATION MODEL
========================= */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: {
    type: String,
    enum: ['order', 'promo', 'price_drop', 'stock', 'system', 'review', 'reward'],
    default: 'system'
  },

  title:   { type: String, required: true },
  message: { type: String, default: '' },
  icon:    { type: String, default: '🔔' },
  read:    { type: Boolean, default: false },

  /* Action data */
  data: {
    link:      { type: String, default: '' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
  }

}, { timestamps: true });

/* Auto-expire after 30 days */
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
