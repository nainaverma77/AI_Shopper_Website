/* =========================
   AUTH MIDDLEWARE
========================= */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — requires valid JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    /* Get token from Authorization header */
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized — no token' });
    }

    /* Verify token */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* Find user */
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Not authorized' });
  }
};

/**
 * Optional auth — attaches user if token present, continues if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshToken');
    }
  } catch (e) {
    /* Silently continue without auth */
  }
  next();
};

/**
 * Admin only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

module.exports = { protect, optionalAuth, adminOnly };
