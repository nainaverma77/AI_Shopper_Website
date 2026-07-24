/* =========================
   ORDER MODEL
========================= */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title:    String,
  image:    String,
  price:    Number,
  quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status:    String,
  message:   String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNo: { type: String, unique: true },

  /* Items */
  items:      [orderItemSchema],
  totalItems: { type: Number, default: 0 },

  /* Pricing */
  subtotal:      { type: Number, required: true },
  shippingCost:  { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  couponCode:    { type: String, default: '' },
  totalAmount:   { type: Number, required: true },

  /* Shipping */
  shippingAddress: {
    fullName: String,
    phone:    String,
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
    country:  { type: String, default: 'India' }
  },

  /* Payment */
  paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'upi', 'card', 'netbanking', 'cod', 'wallet'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId:     { type: String, default: '' },

  /* Order Status */
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'placed'
  },

  /* Tracking */
  trackingId:        { type: String, default: '' },
  estimatedDelivery: { type: Date },
  deliveredAt:       { type: Date },

  /* Timeline */
  timeline: [timelineSchema],

  /* Notes */
  notes: { type: String, default: '' }

}, { timestamps: true });

/* Generate order number */
orderSchema.pre('save', function(next) {
  if (!this.orderNo) {
    this.orderNo = 'AIS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }

  // Set estimated delivery (5 days from order)
  if (!this.estimatedDelivery) {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    this.estimatedDelivery = d;
  }

  // Add initial timeline entry
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({
      status: 'placed',
      message: 'Order placed successfully'
    });
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);
