/* =========================
   PAYMENT MODEL
========================= */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },

  /* Payment Info */
  method:        { type: String, enum: ['razorpay', 'stripe', 'upi', 'card', 'netbanking', 'cod', 'wallet'], required: true },
  gateway:       { type: String, enum: ['razorpay', 'stripe', 'manual'], default: 'manual' },
  transactionId: { type: String, default: '' },
  gatewayOrderId:{ type: String, default: '' },

  /* Amount */
  amount:   { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  /* Status */
  status:       { type: String, enum: ['initiated', 'pending', 'completed', 'failed', 'refunded'], default: 'initiated' },
  refundStatus: { type: String, enum: ['none', 'requested', 'processing', 'completed'], default: 'none' },
  refundAmount: { type: Number, default: 0 },

  /* Metadata */
  gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  paidAt:          { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
