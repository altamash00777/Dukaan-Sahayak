const AIActionLog = require('../models/AIActionLog');
const groqService = require('../services/groqService');

/**
 * @desc    Chat with Dukaan Sahayak AI Assistant with tool calling execution
 * @route   POST /api/assistant/chat
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory, systemNote } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A text message is required',
      });
    }

    const response = await groqService.processMessage(
      req.shopId,
      req.user._id,
      message,
      Array.isArray(conversationHistory) ? conversationHistory : [],
      typeof systemNote === 'string' ? systemNote : ''
    );

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent AI interactions & action history
 * @route   GET /api/assistant/history
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

    const logs = await AIActionLog.find({ shopId: req.shopId })
      .sort({ timestamp: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getHistory,
};
