/* =========================
   REVIEW MODEL
========================= */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

  rating:  { type: Number, required: true, min: 1, max: 5 },
  title:   { type: String, default: '' },
  text:    { type: String, default: '' },
  images:  [String],

  /* Trust & Verification */
  verified:        { type: Boolean, default: false },
  fakeProbability: { type: Number, default: 0, min: 0, max: 100 },
  trustScore:      { type: Number, default: 80, min: 0, max: 100 },

  /* Engagement */
  helpful:   { type: Number, default: 0 },
  reported:  { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true }

}, { timestamps: true });

/* One review per user per product */
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
