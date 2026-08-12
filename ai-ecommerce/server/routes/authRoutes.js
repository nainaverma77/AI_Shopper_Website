/* =========================
   AUTH ROUTES
========================= */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe
} = require('../controllers/authController');

router.post('/register', validate({
  name:     { required: true, minLength: 2 },
  email:    { required: true, type: 'email' },
  password: { required: true, minLength: 6 }
}), register);

router.post('/login', validate({
  email:    { required: true, type: 'email' },
  password: { required: true }
}), login);

router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

/* Profile update */
router.put('/profile', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ user, message: 'Profile updated' });
  } catch (err) { next(err); }
});

/* Address CRUD */
router.post('/addresses', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.addresses.push(req.body);
    await user.save();
    res.json({ addresses: user.addresses, message: 'Address added' });
  } catch (err) { next(err); }
});

router.put('/addresses/:id', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ error: 'Address not found' });
    Object.assign(addr, req.body);
    await user.save();
    res.json({ addresses: user.addresses, message: 'Address updated' });
  } catch (err) { next(err); }
});

router.delete('/addresses/:id', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    await user.save();
    res.json({ addresses: user.addresses, message: 'Address deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
