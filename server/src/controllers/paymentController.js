const ledgerService = require('../services/ledgerService');

/**
 * @desc    Record customer payment towards ledger or specific invoice
 * @route   POST /api/payments
 * @access  Private
 */
const recordPayment = async (req, res, next) => {
  try {
    const { customerId, invoiceId, amount, method, reference, notes } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required to record a payment',
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive payment amount is required',
      });
    }

    const result = await ledgerService.recordPayment(
      req.shopId,
      customerId,
      invoiceId,
      amount,
      method || 'cash',
      reference || '',
      notes || ''
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded and ledger balance updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer ledger/khata statement
 * @route   GET /api/payments/customer/:customerId/ledger
 * @access  Private
 */
const getCustomerLedger = async (req, res, next) => {
  try {
    const ledger = await ledgerService.getCustomerLedger(req.shopId, req.params.customerId);

    res.status(200).json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayment,
  getCustomerLedger,
};
