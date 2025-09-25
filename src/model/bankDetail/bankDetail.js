const mongoose = require("mongoose");

const bankDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      minlength: 9,
      maxlength: 18,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{4}0[A-Z0-9]{6}$/, // IFSC code format validation
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BankDetail", bankDetailSchema);
