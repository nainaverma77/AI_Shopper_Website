/* =========================
   PRODUCT MODEL
========================= */
const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  key:   String,
  value: String
}, { _id: false });

const productSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, index: 'text' },
  slug:        { type: String, unique: true, lowercase: true },
  description: { type: String, default: '' },
  shortDesc:   { type: String, default: '' },

  /* Pricing */
  price:         { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },   // percentage
  currency:      { type: String, default: 'INR' },

  /* Categorization */
  category:    { type: String, required: true, index: true },
  subcategory: { type: String, default: '' },
  brand:       { type: String, default: '' },
  tags:        [String],

  /* Media */
  images:     [String],
  thumbnail:  { type: String, default: '' },
  video:      { type: String, default: '' },

  /* Details */
  specifications: [specificationSchema],
  highlights:     [String],
  warranty:       { type: String, default: '1 Year Manufacturer Warranty' },
  returnPolicy:   { type: String, default: '7 Day Return Policy' },

  /* Inventory */
  stock:    { type: Number, default: 100 },
  sku:      { type: String, default: '' },

  /* Ratings */
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  /* AI Features */
  aiSummary:     { type: String, default: '' },
  carbonScore:   { type: Number, default: 0, min: 0, max: 100 },
  sustainability:{ type: String, enum: ['low', 'medium', 'high', 'excellent'], default: 'medium' },
  trendingScore: { type: Number, default: 0 },

  /* Delivery */
  deliveryDays:  { type: Number, default: 5 },
  freeDelivery:  { type: Boolean, default: false },
  codAvailable:  { type: Boolean, default: true },

  /* Status */
  isActive:   { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }

}, { timestamps: true });

/* Text index for search */
productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });

/* Generate slug before save */
productSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }

  // Calculate discount percentage
  if (this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }

  next();
});

/* Virtual: formatted price */
productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toLocaleString('en-IN')}`;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
