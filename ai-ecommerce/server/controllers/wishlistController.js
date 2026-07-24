/* =========================
   WISHLIST CONTROLLER
========================= */
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'title price originalPrice discount thumbnail images stock category rating');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }

    /* Check for price drops */
    const itemsWithPriceInfo = wishlist.items.map(item => {
      if (!item.product) return null;
      const priceDrop = item.priceAtAdd > 0 ? item.priceAtAdd - item.product.price : 0;
      return {
        ...item.toObject(),
        priceDrop: Math.max(0, priceDrop),
        priceDropPercent: item.priceAtAdd > 0
          ? Math.round((priceDrop / item.priceAtAdd) * 100)
          : 0
      };
    }).filter(Boolean);

    res.json({
      wishlist: {
        ...wishlist.toObject(),
        items: itemsWithPriceInfo
      },
      totalItems: itemsWithPriceInfo.length
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/wishlist/add
 * Add product to wishlist
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }

    /* Check if already in wishlist */
    const exists = wishlist.items.some(
      item => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({ error: 'Already in wishlist' });
    }

    wishlist.items.push({
      product: productId,
      priceAtAdd: product.price
    });

    await wishlist.save();
    res.json({ message: 'Added to wishlist', wishlist });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/wishlist/remove/:productId
 * Remove product from wishlist
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== req.params.productId
    );

    await wishlist.save();
    res.json({ message: 'Removed from wishlist', wishlist });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/wishlist/move-to-cart
 * Move item from wishlist to cart
 */
exports.moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const Cart = require('../models/Cart');

    /* Remove from wishlist */
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(
        item => item.product.toString() !== productId
      );
      await wishlist.save();
    }

    /* Add to cart */
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const exists = cart.items.some(
      item => item.product.toString() === productId
    );
    if (!exists) {
      cart.items.push({ product: productId, quantity: 1 });
      await cart.save();
    }

    res.json({ message: 'Moved to cart' });

  } catch (err) {
    next(err);
  }
};
