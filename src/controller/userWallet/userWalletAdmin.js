const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const UserWalletRepository = require("../../model/userWallet/walletIndex");
const WalletHistoryRepository = require("../../model/walletHistory/index");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");
const { validateWalletTransaction } = require("./validator");
const { validateRequest } = require("../../utils/validateRequest");
const router = express.Router();

// Get user wallet details
router.get("/:id", async (req, res, next) => {
  const userId = req.params.id;
  try {
    const wallet = await UserWalletRepository.getUserWallet(userId);

    if (!wallet) {
      return setApiResponse(404, false, null, "Wallet not found", res);
    }

    return setApiResponse(200, true, wallet, null, res);
  } catch (error) {
    return next(error);
  }
});

// router.get("/wallet-summary/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     // 1️⃣ Get user wallet
//     const wallet = await UserWalletRepository.getUserWallet(userId);
//     if (!wallet) {
//       return setApiResponse(404, false, null, "Wallet not found", res);
//     }

//     // 2️⃣ Get latest coin price
//     const latestPriceDoc = await CoinPriceRepository.getCurrentCoinPrice();
//     const currentPrice = latestPriceDoc ? latestPriceDoc.pricePerCoin : 1;

//     const availableValue = wallet.availableCoins * currentPrice;

//     return setApiResponse(
//       200,
//       true,
//       {
//         totalCoins: wallet.totalCoins,
//         availableCoins: wallet.availableCoins,
//         currentPrice,
//         totalInvestedAmount: wallet?.totalInvestedAmount,
//         currentAmount: availableValue,
//       },
//       null,
//       res
//     );
// });

// Admin: Add amount to user wallet
router.post(
  "/add-balance",
  // authenticateAdmin,
  validateWalletTransaction,
  validateRequest,
  async (req, res, next) => {
    try {
      const { userId, amount } = req.body;

      // Check if user wallet exists
      const wallet = await UserWalletRepository.getUserWallet(userId);
      if (!wallet) {
        return setApiResponse(404, false, null, "User wallet not found", res);
      }

      // Add balance to wallet
      const updatedWallet = await UserWalletRepository.addBalance(
        userId,
        parseFloat(amount)
      );

      // Create wallet history entry
      await WalletHistoryRepository.createWalletHistory({
        userId: userId,
        walletId: wallet._id,
        transactionType: "CREDIT",
        amount: parseFloat(amount),
        status: "COMPLETED",
        source: "ADMIN_CREDIT",
        referenceId: `admin_add_${Date.now()}`,
      });

      return setApiResponse(
        200,
        true,
        {
          message: "Amount added successfully",
          wallet: updatedWallet,
          amountAdded: parseFloat(amount),
        },
        null,
        res
      );
    } catch (error) {
      return next(error);
    }
  }
);

// Admin: Deduct amount from user wallet
router.post(
  "/deduct-balance",
  // authenticateAdmin,
  validateWalletTransaction,
  validateRequest,
  async (req, res, next) => {
    try {
      const { userId, amount } = req.body;

      // Check if user wallet exists
      const wallet = await UserWalletRepository.getUserWallet(userId);
      if (!wallet) {
        return setApiResponse(404, false, null, "User wallet not found", res);
      }

      // Check if user has sufficient balance
      if (wallet.totalBalance < parseFloat(amount)) {
        return setApiResponse(
          400,
          false,
          null,
          `Insufficient balance. Available: ${wallet.totalBalance}, Requested: ${amount}`,
          res
        );
      }

      // Deduct balance from wallet
      const updatedWallet = await UserWalletRepository.deductBalance(
        userId,
        parseFloat(amount)
      );

      // Create wallet history entry
      await WalletHistoryRepository.createWalletHistory({
        userId: userId,
        walletId: wallet._id,
        transactionType: "DEBIT",
        amount: parseFloat(amount),
        status: "COMPLETED",
        source: "ADMIN_DEBIT",
        referenceId: `admin_deduct_${Date.now()}`,
      });

      return setApiResponse(
        200,
        true,
        {
          message: "Amount deducted successfully",
          wallet: updatedWallet,
          amountDeducted: parseFloat(amount),
        },
        null,
        res
      );
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
