/* =========================
   CART ROUTES
========================= */
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

router.get('/',                   optionalAuth, getCart);
router.post('/add',               protect, addToCart);
router.put('/update',             protect, updateCartItem);
router.delete('/remove/:productId', protect, removeFromCart);
router.delete('/clear',           protect, clearCart);

module.exports = router;
