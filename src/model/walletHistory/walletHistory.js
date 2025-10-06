const mongoose = require("mongoose");

const walletHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserWallet",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "COMPLETED",
    },
    source: {
      type: String,
      enum: [
        "GAME_WIN",
        "GAME_BET",
        "DEPOSIT",
        "WITHDRAWAL",
        "REFERRAL",
        "ADMIN_CREDIT",
        "ADMIN_DEBIT",
      ],
      required: true,
    },
    referenceId: {
      type: String, // Can reference bet ID, game ID, etc.
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WalletHistory", walletHistorySchema);
