/* =========================
   COUPON MODEL
========================= */
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },

  /* Type */
  type:  { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  value: { type: Number, required: true },

  /* Limits */
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  usageLimit:  { type: Number, default: 100 },
  usedCount:   { type: Number, default: 0 },
  perUserLimit:{ type: Number, default: 1 },

  /* Validity */
  validFrom: { type: Date, default: Date.now },
  validTo:   { type: Date, required: true },
  isActive:  { type: Boolean, default: true },

  /* Applicability */
  applicableCategories: [String],
  applicableProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  excludedProducts:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]

}, { timestamps: true });

/* Check if coupon is valid */
couponSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive &&
         this.usedCount < this.usageLimit &&
         now >= this.validFrom &&
         now <= this.validTo;
};

module.exports = mongoose.model('Coupon', couponSchema);
