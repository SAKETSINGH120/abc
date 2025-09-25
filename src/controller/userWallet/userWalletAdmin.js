const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const UserWalletRepository = require("../../model/userWallet/walletIndex");
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

router.get("/wallet-summary/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1️⃣ Get user wallet
    const wallet = await UserWalletRepository.getUserWallet(userId);
    if (!wallet) {
      return setApiResponse(404, false, null, "Wallet not found", res);
    }

    // 2️⃣ Get latest coin price
    const latestPriceDoc = await CoinPriceRepository.getCurrentCoinPrice();
    const currentPrice = latestPriceDoc ? latestPriceDoc.pricePerCoin : 1;

    const availableValue = wallet.availableCoins * currentPrice;

    return setApiResponse(
      200,
      true,
      {
        totalCoins: wallet.totalCoins,
        availableCoins: wallet.availableCoins,
        currentPrice,
        totalInvestedAmount: wallet?.totalInvestedAmount,
        currentAmount: availableValue,
      },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
