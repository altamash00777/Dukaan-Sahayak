const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');

/**
 * Generate signed JWT token
 * @param {object} user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'dukaan_sahayak_jwt_secret_key_123456',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @desc    Register a new store owner and shop profile in one atomic operation
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, shopName, address, gstin, language } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // 1. Create User
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash: password, // Pre-save hook hashes this
    });
    await user.save();

    // 2. Create Shop
    const shop = new Shop({
      ownerId: user._id,
      shopName,
      address: address || '',
      gstin: gstin ? gstin.toUpperCase() : '',
      phone: phone || '',
      language: language || 'hinglish',
      invoicePrefix: 'INV-',
      invoiceCounter: 0,
    });
    await shop.save();

    // 3. Issue Token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Shopkeeper account registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        shop: {
          id: shop._id,
          shopName: shop.shopName,
          address: shop.address,
          gstin: shop.gstin,
          language: shop.language,
          invoicePrefix: shop.invoicePrefix,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token + shop data
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const shop = await Shop.findOne({ ownerId: user._id });
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        shop: shop
          ? {
              id: shop._id,
              shopName: shop.shopName,
              address: shop.address,
              gstin: shop.gstin,
              language: shop.language,
              invoicePrefix: shop.invoicePrefix,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user & shop details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const shop = req.shop;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
        },
        shop: {
          id: shop._id,
          shopName: shop.shopName,
          address: shop.address,
          gstin: shop.gstin,
          phone: shop.phone,
          language: shop.language,
          invoicePrefix: shop.invoicePrefix,
          invoiceCounter: shop.invoiceCounter,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
