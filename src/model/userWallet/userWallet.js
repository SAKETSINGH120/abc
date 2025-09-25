const mongoose = require("mongoose");

const userWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// module.exports = mongoose.model('UserWallet', userWalletSchema)
module.exports =
  mongoose.models.UserWallet || mongoose.model("UserWallet", userWalletSchema);
