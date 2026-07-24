/* =========================
   CART CONTROLLER
========================= */
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * GET /api/cart
 * Get current user's cart (or guest cart from body)
 */
exports.getCart = async (req, res, next) => {
  try {
    /* For guest users, return empty cart structure */
    if (!req.user) {
      return res.json({ cart: { items: [], savedForLater: [] }, total: 0 });
    }

    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title price originalPrice discount thumbnail images stock category')
      .populate('savedForLater', 'title price originalPrice discount thumbnail images stock category');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    /* Calculate totals */
    let subtotal = 0;
    const validItems = [];

    for (const item of cart.items) {
      if (item.product) {
        subtotal += item.product.price * item.quantity;
        validItems.push(item);
      }
    }

    const shippingCost = subtotal > 500 ? 0 : 49;
    const taxRate = 0.18;
    const taxAmount = Math.round(subtotal * taxRate);
    const total = subtotal + shippingCost + taxAmount;

    res.json({
      cart: {
        ...cart.toObject(),
        items: validItems
      },
      pricing: {
        subtotal: Math.round(subtotal),
        shippingCost,
        taxAmount,
        total: Math.round(total),
        freeDelivery: subtotal > 500,
        itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cart/add
 * Add item to cart
 */
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    /* Verify product exists and has stock */
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < 1) return res.status(400).json({ error: 'Product out of stock' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    /* Check if already in cart */
    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = Math.min(
        cart.items[existingIndex].quantity + quantity,
        10
      );
    } else {
      cart.items.push({ product: productId, quantity: Math.min(quantity, 10) });
    }

    await cart.save();

    /* Return populated cart */
    await cart.populate('items.product', 'title price originalPrice discount thumbnail images stock category');

    res.json({ message: 'Added to cart', cart });

  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/cart/update
 * Update item quantity
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) return res.status(404).json({ error: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        item => item.product.toString() !== productId
      );
    } else {
      item.quantity = Math.min(quantity, 10);
    }

    await cart.save();
    res.json({ message: 'Cart updated', cart });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart/remove/:productId
 * Remove item from cart
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(
      item => item.product.toString() !== req.params.productId
    );

    await cart.save();
    res.json({ message: 'Removed from cart', cart });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart/clear
 * Clear entire cart
 */
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponApplied: '' }
    );
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
