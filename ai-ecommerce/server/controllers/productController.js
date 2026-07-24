/* =========================
   PRODUCT CONTROLLER
========================= */
const Product = require('../models/Product');

/**
 * GET /api/products
 * List products with pagination, filtering, sorting, and search
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
      sort = 'trendingScore',
      order = 'desc',
      search,
      featured,
      inStock
    } = req.query;

    /* Build filter */
    const filter = { isActive: true };

    if (category && category !== 'all') filter.category = category;
    if (brand) filter.brand = brand;
    if (featured === 'true') filter.isFeatured = true;
    if (inStock === 'true') filter.stock = { $gt: 0 };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    /* Text search */
    if (search) {
      filter.$text = { $search: search };
    }

    /* Build sort */
    const sortObj = {};
    if (search) {
      sortObj.score = { $meta: 'textScore' };
    }

    const validSorts = ['price', 'rating', 'createdAt', 'trendingScore', 'reviewCount'];
    if (validSorts.includes(sort)) {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    }

    /* Execute query */
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/categories
 * Get all unique categories with counts
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } }
    ]);

    const categoryIcons = {
      'smartphones': '📱', 'laptops': '💻', 'fragrances': '🌸',
      'skincare': '🧴', 'groceries': '🛒', 'home-decoration': '🏠',
      'furniture': '🪑', 'tops': '👕', 'womens-dresses': '👗',
      'womens-shoes': '👠', 'mens-shirts': '👔', 'mens-shoes': '👞',
      'mens-watches': '⌚', 'womens-watches': '⌚', 'womens-bags': '👜',
      'womens-jewellery': '💎', 'sunglasses': '🕶️', 'automotive': '🚗',
      'motorcycle': '🏍️', 'lighting': '💡', 'beauty': '💄',
      'sports-accessories': '⚽', 'tablets': '📟', 'kitchen-accessories': '🍳',
      'vehicle': '🚙', 'mobile-accessories': '📲', 'skin-care': '🧴'
    };

    res.json({
      categories: categories.map(c => ({
        name: c._id,
        count: c.count,
        avgPrice: Math.round(c.avgPrice),
        icon: categoryIcons[c._id] || '📦'
      }))
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 * Get single product
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/search/smart
 * Smart AI-like search with NLP intent matching
 */
exports.smartSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const query = q.toLowerCase();

    /* Extract price intent */
    let maxPrice = null;
    const priceMatch = query.match(/(?:under|below|within|budget|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (priceMatch) maxPrice = Number(priceMatch[1]);

    /* Category intent mapping */
    const categoryMap = {
      'laptop': 'laptops', 'phone': 'smartphones', 'mobile': 'smartphones',
      'perfume': 'fragrances', 'fragrance': 'fragrances',
      'shoe': 'mens-shoes', 'shoes': 'mens-shoes',
      'shirt': 'mens-shirts', 'watch': 'mens-watches',
      'bag': 'womens-bags', 'dress': 'womens-dresses',
      'skincare': 'skincare', 'skin care': 'skincare',
      'furniture': 'furniture', 'grocery': 'groceries',
      'sunglasses': 'sunglasses', 'jewellery': 'womens-jewellery',
      'jewelry': 'womens-jewellery', 'decoration': 'home-decoration',
      'gaming': 'laptops', 'camera': 'smartphones',
      'kitchen': 'kitchen-accessories', 'sports': 'sports-accessories',
      'tablet': 'tablets', 'beauty': 'beauty'
    };

    let matchedCategory = null;
    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (query.includes(keyword)) {
        matchedCategory = cat;
        break;
      }
    }

    /* Build smart filter */
    const filter = { isActive: true };

    if (matchedCategory) filter.category = matchedCategory;
    if (maxPrice) filter.price = { $lte: maxPrice };

    /* Use text search for remaining terms */
    const cleanedQuery = query
      .replace(/(?:under|below|within|budget|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*\d+/gi, '')
      .replace(/(?:i need|i want|best|good|top|show me|find|search|for|a|an|the|my)/gi, '')
      .trim();

    if (cleanedQuery.length > 2) {
      filter.$text = { $search: cleanedQuery };
    }

    /* Sort by relevance */
    const sortObj = {};
    if (filter.$text) sortObj.score = { $meta: 'textScore' };
    sortObj.trendingScore = -1;
    sortObj.rating = -1;

    const products = await Product.find(filter)
      .sort(sortObj)
      .limit(20)
      .select('-__v');

    /* If no text search results, try regex fallback */
    let results = products;
    if (results.length === 0 && cleanedQuery.length > 1) {
      delete filter.$text;
      const regex = new RegExp(cleanedQuery.split(/\s+/).join('|'), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { brand: regex },
        { tags: regex }
      ];
      results = await Product.find(filter)
        .sort({ trendingScore: -1, rating: -1 })
        .limit(20)
        .select('-__v');
    }

    res.json({
      products: results,
      searchMeta: {
        query: q,
        matchedCategory,
        maxPrice,
        totalResults: results.length,
        aiParsed: true
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/recommended
 * AI-style recommendations based on user behavior or random trending
 */
exports.getRecommended = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;

    /* Get trending/featured products with some randomness */
    const products = await Product.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 } } },
      { $addFields: { randomScore: { $multiply: ['$trendingScore', { $rand: {} }] } } },
      { $sort: { randomScore: -1 } },
      { $limit: limit }
    ]);

    res.json({ products });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/deals
 * Products with highest discounts
 */
exports.getDeals = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      discount: { $gt: 10 },
      stock: { $gt: 0 }
    })
    .sort({ discount: -1 })
    .limit(10)
    .select('-__v');

    res.json({ products });

  } catch (err) {
    next(err);
  }
};
