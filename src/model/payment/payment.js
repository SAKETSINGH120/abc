const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User" },
    amount: { type: Number },
    paymentImage: { type: String, required: false }, // Make optional for withdrawals
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    type: { type: String, enum: ["ADD", "WITHDRAWL"], default: null },
    paymentMethod: { type: String },
    paymentNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("payment", paymentSchema);
