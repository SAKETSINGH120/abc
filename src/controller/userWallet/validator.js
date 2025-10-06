const { body } = require("express-validator");

const validateWalletTransaction = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      return true;
    }),

  body("reason")
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage("Reason must be between 3 and 200 characters"),
];

module.exports = {
  validateWalletTransaction,
};
