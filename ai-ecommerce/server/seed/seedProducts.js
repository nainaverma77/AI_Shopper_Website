/* =========================
   SEED SCRIPT — Populate MongoDB with products
========================= */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aishopper';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    /* Clear existing data and indexes */
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Coupon.deleteMany({});
    try { await Product.collection.dropIndexes(); } catch(e) { /* ignore */ }
    console.log('🗑️  Cleared existing products, categories, and coupons');

    /* Fetch from DummyJSON */
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://dummyjson.com/products?limit=100');
    const data = await res.json();

    console.log(`📦 Fetched ${data.products.length} products from DummyJSON`);

    /* Transform and enhance products */
    const products = data.products.map((p, i) => {
      const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + (i + 1);
      const priceINR = Math.round(p.price * 80);
      const originalPrice = Math.round(priceINR * (1 + (p.discountPercentage || 10) / 100));

      return {
        title: p.title,
        slug,
        description: p.description || `${p.title} — High quality product with premium features. Perfect for everyday use.`,
        shortDesc: p.title.slice(0, 60),
        price: priceINR,
        originalPrice,
        discount: Math.round(p.discountPercentage || 0),
        category: p.category,
        brand: p.brand || 'AiShopper',
        tags: [p.category, p.brand, ...(p.tags || [])].filter(Boolean),
        images: p.images || [p.thumbnail],
        thumbnail: p.thumbnail,
        specifications: generateSpecs(p),
        highlights: generateHighlights(p),
        stock: Math.floor(Math.random() * 200) + 10,
        rating: p.rating || (3.5 + Math.random() * 1.5),
        reviewCount: Math.floor(Math.random() * 500) + 10,
        warranty: getWarranty(p.category),
        returnPolicy: '7 Day Easy Return Policy',
        deliveryDays: Math.floor(Math.random() * 5) + 2,
        freeDelivery: priceINR > 500,
        codAvailable: true,
        trendingScore: Math.floor(Math.random() * 100),
        carbonScore: Math.floor(Math.random() * 100),
        sustainability: ['low', 'medium', 'high', 'excellent'][Math.floor(Math.random() * 4)],
        isFeatured: i < 12,
        aiSummary: generateAISummary(p)
      };
    });

    await Product.insertMany(products);
    console.log(`✅ Inserted ${products.length} products`);

    /* Create categories */
    const categorySet = [...new Set(products.map(p => p.category))];
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

    const categories = categorySet.map((name, i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
      slug: name,
      icon: categoryIcons[name] || '📦',
      sortOrder: i
    }));

    await Category.insertMany(categories);
    console.log(`✅ Inserted ${categories.length} categories`);

    /* Create sample coupons */
    const coupons = [
      { code: 'WELCOME10', description: '10% off on first order', type: 'percentage', value: 10, maxDiscount: 500, validTo: new Date('2027-12-31') },
      { code: 'FLAT200', description: '₹200 off on orders above ₹1000', type: 'flat', value: 200, minPurchase: 1000, validTo: new Date('2027-12-31') },
      { code: 'AI30', description: '30% off — AI Special', type: 'percentage', value: 30, maxDiscount: 2000, minPurchase: 2000, validTo: new Date('2027-06-30') },
      { code: 'SUMMER15', description: '15% Summer Sale', type: 'percentage', value: 15, maxDiscount: 1000, validTo: new Date('2027-08-31') },
      { code: 'FLAT500', description: '₹500 off on orders above ₹3000', type: 'flat', value: 500, minPurchase: 3000, validTo: new Date('2027-12-31') }
    ];

    await Coupon.insertMany(coupons);
    console.log(`✅ Inserted ${coupons.length} coupons`);

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

/* ============ HELPERS ============ */

function generateSpecs(p) {
  const specs = [];
  if (p.brand) specs.push({ key: 'Brand', value: p.brand });
  if (p.weight) specs.push({ key: 'Weight', value: `${p.weight}g` });
  if (p.dimensions) {
    specs.push({ key: 'Dimensions', value: `${p.dimensions.width} × ${p.dimensions.height} × ${p.dimensions.depth} cm` });
  }
  if (p.warrantyInformation) specs.push({ key: 'Warranty', value: p.warrantyInformation });
  if (p.shippingInformation) specs.push({ key: 'Shipping', value: p.shippingInformation });
  if (p.availabilityStatus) specs.push({ key: 'Availability', value: p.availabilityStatus });
  if (p.returnPolicy) specs.push({ key: 'Return Policy', value: p.returnPolicy });
  specs.push({ key: 'SKU', value: p.sku || `AIS-${p.id}` });
  return specs;
}

function generateHighlights(p) {
  const h = [];
  if (p.brand) h.push(`Authentic ${p.brand} product`);
  h.push(`${p.rating?.toFixed(1) || '4.0'} ★ rating from customers`);
  if (p.discountPercentage > 10) h.push(`${Math.round(p.discountPercentage)}% off — Limited time deal`);
  h.push('Free delivery on orders above ₹500');
  h.push('COD available');
  return h;
}

function getWarranty(category) {
  const warranties = {
    'smartphones': '1 Year Brand Warranty',
    'laptops': '2 Year Manufacturer Warranty',
    'mens-watches': '1 Year International Warranty',
    'womens-watches': '1 Year International Warranty'
  };
  return warranties[category] || '6 Month Seller Warranty';
}

function generateAISummary(p) {
  const rating = p.rating || 4.0;
  let sentiment = 'well-received';
  if (rating >= 4.5) sentiment = 'highly acclaimed';
  else if (rating >= 4.0) sentiment = 'popular';
  else if (rating < 3.5) sentiment = 'budget-friendly';

  return `${p.title} by ${p.brand || 'the brand'} is a ${sentiment} product in the ${p.category.replace(/-/g, ' ')} category. ` +
    `Priced competitively with a ${Math.round(p.discountPercentage || 0)}% discount, it offers great value for money. ` +
    `Customers appreciate its quality and reliability.`;
}

seed();
