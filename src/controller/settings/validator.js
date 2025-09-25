const { body } = require("express-validator");

const settingValidation = [
  body("lockPeriod")
    .notEmpty()
    .withMessage("lockPeriod is required")
    .isInt({ min: 1 })
    .withMessage("lockPeriod must be a positive integer (days)"),
  body("referralCommissionPercentage")
    .notEmpty()
    .withMessage("referralCommissionPercentage is required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("referralCommissionPercentage must be between 0 and 100"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

module.exports = {
  settingValidation,
};
