/* =========================
   AISHOPPER — EXPRESS SERVER
========================= */
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   DATABASE
========================= */
connectDB();

/* =========================
   SECURITY MIDDLEWARE
========================= */

// Helmet — secure HTTP headers (relaxed CSP for dev)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Rate Limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// MongoDB query injection sanitization
app.use(mongoSanitize());

/* =========================
   BODY PARSING & COMPRESSION
========================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

/* =========================
   STATIC FILES — Serve frontend
========================= */
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   API ROUTES
========================= */
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'AiShopper API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* =========================
   SPA FALLBACK — serve index.html for non-API routes
========================= */
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use(require('./middleware/errorHandler'));

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🛍️  AiShopper Server Running       ║
  ║   📡  Port: ${PORT}                     ║
  ║   🌐  http://localhost:${PORT}           ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
