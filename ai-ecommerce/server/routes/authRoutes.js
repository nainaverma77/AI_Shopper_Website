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

module.exports = router;
