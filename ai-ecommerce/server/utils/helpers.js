/* =========================
   UTILITY HELPERS
========================= */

/**
 * Generate pagination metadata
 */
exports.paginate = (page, limit, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  pages: Math.ceil(total / Number(limit)),
  hasNext: Number(page) * Number(limit) < total,
  hasPrev: Number(page) > 1
});

/**
 * Get greeting based on time of day
 */
exports.getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

/**
 * Get current season (India-centric)
 */
exports.getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'summer';
  if (month >= 6 && month <= 9) return 'monsoon';
  if (month >= 10 && month <= 11) return 'autumn';
  return 'winter';
};

/**
 * Capitalize string
 */
exports.capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
};

/**
 * Format price in INR
 */
exports.formatPrice = (price) => {
  return `₹${Number(price).toLocaleString('en-IN')}`;
};

/**
 * Generate a random hex color
 */
exports.randomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};
