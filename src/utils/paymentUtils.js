const crypto = require("crypto");
const { PAYMENT_LIMITS } = require("../constants/payment");

/**
 * Validate Razorpay signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @param {string} secret - Razorpay secret key
 * @returns {boolean} - True if signature is valid
 */
const validateRazorpaySignature = (orderId, paymentId, signature, secret) => {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");
    return generatedSignature === signature;
  } catch (error) {
    console.error("Signature validation error:", error);
    return false;
  }
};

/**
 * Validate payment amount
 * @param {number} amount - Payment amount
 * @returns {object} - Validation result
 */
const validatePaymentAmount = (amount) => {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      error: "Amount must be a positive number",
    };
  }

  if (numericAmount < PAYMENT_LIMITS.MIN_AMOUNT) {
    return {
      isValid: false,
      error: `Minimum amount is ₹${PAYMENT_LIMITS.MIN_AMOUNT}`,
    };
  }

  if (numericAmount > PAYMENT_LIMITS.MAX_AMOUNT) {
    return {
      isValid: false,
      error: `Maximum amount is ₹${PAYMENT_LIMITS.MAX_AMOUNT}`,
    };
  }

  return {
    isValid: true,
    amount: numericAmount,
  };
};

/**
 * Calculate coins from amount
 * @param {number} amount - Payment amount
 * @param {number} coinPrice - Current coin price
 * @returns {number} - Number of coins
 */
const calculateCoins = (amount, coinPrice) => {
  if (!coinPrice || coinPrice <= 0) {
    throw new Error("Invalid coin price");
  }
  return parseFloat((amount / coinPrice).toFixed(8));
};

/**
 * Generate secure receipt ID
 * @returns {string} - Receipt ID
 */
const generateReceiptId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `rct_${timestamp}_${random}`;
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitize payment data for logging
 * @param {object} paymentData - Payment data
 * @returns {object} - Sanitized data
 */
const sanitizePaymentData = (paymentData) => {
  const sanitized = { ...paymentData };

  // Remove sensitive information
  delete sanitized.razorpay_signature;
  delete sanitized.signature;

  return sanitized;
};

module.exports = {
  validateRazorpaySignature,
  validatePaymentAmount,
  calculateCoins,
  generateReceiptId,
  isValidObjectId,
  sanitizePaymentData,
};
