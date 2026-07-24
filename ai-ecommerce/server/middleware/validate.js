/* =========================
   VALIDATION MIDDLEWARE
========================= */

/**
 * Validate request body fields
 */
const validate = (rules) => (req, res, next) => {
  const errors = [];

  for (const [field, checks] of Object.entries(rules)) {
    const value = req.body[field];

    if (checks.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (checks.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} must be a valid email`);
      }

      if (checks.minLength && String(value).length < checks.minLength) {
        errors.push(`${field} must be at least ${checks.minLength} characters`);
      }

      if (checks.maxLength && String(value).length > checks.maxLength) {
        errors.push(`${field} must be at most ${checks.maxLength} characters`);
      }

      if (checks.type === 'number' && isNaN(Number(value))) {
        errors.push(`${field} must be a number`);
      }

      if (checks.min !== undefined && Number(value) < checks.min) {
        errors.push(`${field} must be at least ${checks.min}`);
      }

      if (checks.max !== undefined && Number(value) > checks.max) {
        errors.push(`${field} must be at most ${checks.max}`);
      }

      if (checks.enum && !checks.enum.includes(value)) {
        errors.push(`${field} must be one of: ${checks.enum.join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

/**
 * Sanitize string inputs — strip HTML tags
 */
const sanitize = (req, res, next) => {
  const stripTags = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '').trim();
  };

  const sanitizeObj = (obj) => {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = stripTags(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObj(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);

  next();
};

module.exports = { validate, sanitize };
