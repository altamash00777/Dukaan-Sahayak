const Shop = require('../models/Shop');

/**
 * @desc    Get current shop profile
 * @route   GET /api/shop/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.shopId).populate('ownerId', 'name email phone');
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update shop profile details
 * @route   PUT /api/shop/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'shopName',
      'address',
      'gstin',
      'phone',
      'language',
      'invoicePrefix',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.gstin) {
      updates.gstin = updates.gstin.toUpperCase().trim();
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.shopId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedShop) {
      return res.status(404).json({
        success: false,
        message: 'Shop profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shop profile updated successfully',
      data: updatedShop,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
