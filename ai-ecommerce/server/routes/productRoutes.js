/* =========================
   PRODUCT ROUTES
========================= */
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getProducts,
  getCategories,
  getProductById,
  smartSearch,
  getRecommended,
  getDeals
} = require('../controllers/productController');

router.get('/',            optionalAuth, getProducts);
router.get('/categories',  getCategories);
router.get('/search/smart', optionalAuth, smartSearch);
router.get('/recommended', optionalAuth, getRecommended);
router.get('/deals',       getDeals);
router.get('/:id',         optionalAuth, getProductById);

module.exports = router;
