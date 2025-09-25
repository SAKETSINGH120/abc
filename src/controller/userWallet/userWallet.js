const express = require("express");
const router = express.Router();
const UserWalletRepository = require("../../model/userWallet/walletIndex");
const { setApiResponse } = require("../../utils/setApiResponse");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");
const SettingRepository = require("../../model/settings/index");

// Get user wallet details
router.get("/", authenticateUser, async (req, res, next) => {
  const { userId } = req?.user;
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

// Create new wallet for user
router.post("/create/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if wallet already exists
    const existingWallet = await UserWalletRepository.getUserWallet(userId);
    if (existingWallet) {
      return setApiResponse(400, false, null, "Wallet already exists", res);
    }

    const wallet = await UserWalletRepository.createUserWallet(userId);
    return setApiResponse(201, true, wallet, null, res);
  } catch (error) {
    return next(error);
  }
});

router.get("/", authenticateUser, async (req, res, next) => {
  const { userId } = req?.user;
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

router.get("/wallet-summary", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.user;

    // 1️⃣ Get user wallet
    const wallet = await UserWalletRepository.getUserWallet(userId);
    if (!wallet) {
      return setApiResponse(404, false, null, "Wallet not found", res);
    }

    const lockPeriodDetails = await SettingRepository.getLockedPeriod();

    console.log("lockPeriod", lockPeriodDetails);

    const totalSeconds = lockPeriodDetails.lockPeriod * 24 * 60 * 60; // 95 days in seconds
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(lockPeriodDetails.createdAt)) / 1000
    );
    let remainingSeconds = totalSeconds - elapsedSeconds;

    if (remainingSeconds < 0) remainingSeconds = 0;

    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    let lockPeriodf = `${days}:${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

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
        lockPeriod: lockPeriodf,
      },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
