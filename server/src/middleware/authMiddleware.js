const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');

/**
 * Helper to fetch shop ID associated with a user
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<mongoose.Types.ObjectId>} shopId
 */
const getAuthorizedShopId = async (userId) => {
  const shop = await Shop.findOne({ ownerId: userId }).select('_id');
  if (!shop) {
    throw new Error('No shop profile found for this user account');
  }
  return shop._id;
};

/**
 * Authentication middleware that verifies JWT and populates req.user and req.shopId
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please log in to proceed.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dukaan_sahayak_jwt_secret_key_123456'
    );

    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    const shop = await Shop.findOne({ ownerId: user._id });
    if (!shop) {
      return res.status(403).json({
        success: false,
        message: 'No shop associated with this user account.',
      });
    }

    // Attach to request
    req.user = user;
    req.shop = shop;
    req.shopId = shop._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authorization token expired. Please log in again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
  getAuthorizedShopId,
};
