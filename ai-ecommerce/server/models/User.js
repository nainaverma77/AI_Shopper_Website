/* =========================
   USER MODEL
========================= */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },
  fullName: String,
  phone:    String,
  line1:    String,
  line2:    String,
  city:     String,
  state:    String,
  pincode:  String,
  country:  { type: String, default: 'India' },
  isDefault:{ type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6 },
  avatar:    { type: String, default: '' },
  phone:     { type: String, default: '' },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },

  /* Authentication */
  emailVerified:  { type: Boolean, default: false },
  otp:            { type: String, default: null },
  otpExpiresAt:   { type: Date, default: null },
  resetToken:     { type: String, default: null },
  resetExpiresAt: { type: Date, default: null },
  refreshToken:   { type: String, default: null },

  /* Addresses */
  addresses: [addressSchema],

  /* AI Personalization */
  preferences: {
    categories: [String],
    brands:     [String],
    priceRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 200000 } }
  },
  searchHistory:  [{ query: String, timestamp: { type: Date, default: Date.now } }],
  viewHistory:    [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, timestamp: { type: Date, default: Date.now } }],
  shoppingPersonality: {
    type: { type: String, default: 'general' },
    traits: [String],
    analyzedAt: Date
  },

  /* Wallet & Rewards */
  wallet:       { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },

  /* Settings */
  darkMode:     { type: Boolean, default: true },
  notifications:{ type: Boolean, default: true }

}, { timestamps: true });

/* Hash password before save */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* Compare password method */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* Generate referral code */
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'AI' + this.name.slice(0, 3).toUpperCase() + Date.now().toString(36).toUpperCase();
  }
  next();
});

/* Remove password from JSON output */
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.otp;
  delete obj.resetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
