const express = require("express");
const router = express.Router();
const User = require("../model/user/user");
const Game = require("../model/game/game");
const Bet = require("../model/bet/bet");
const GameResult = require("../model/gameResult/gameResult");
const { setApiResponse } = require("../utils/setApiResponse");
const Payment = require("../model/payment/payment");
const walletHistoryRepository = require("../model/walletHistory/index");

router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalGames, totalBets, totalResults] = await Promise.all(
      [
        User.countDocuments(),
        Game.countDocuments(),
        Bet.countDocuments(),
        GameResult.countDocuments({ result: { $ne: null } }),
      ]
    );
    const [
      totalPaymentRequests,
      totalApprovePayments,
      totalWithdrawRequests,
      totalApproveWithdrawPayments,
      referralStats,
    ] = await Promise.all([
      // Payment requests (type: ADD)
      Payment.countDocuments({ type: "ADD", status: "pending" }),
      Payment.countDocuments({ type: "ADD", status: "approved" }),
      // Withdraw requests (type: WITHDRAWL)
      Payment.countDocuments({ type: "WITHDRAWL", status: "pending" }),
      Payment.countDocuments({ type: "WITHDRAWL", status: "approved" }),
      // Referral statistics
      walletHistoryRepository.getReferralStatistics(),
    ]);

    return setApiResponse(
      200,
      true,
      {
        totalUsers,
        totalGames,
        totalBets,
        totalResultsDeclared: totalResults,
        totalPaymentRequests,
        totalWithdrawRequests,
        totalApprovePayments,
        totalApproveWithdrawPayments,
        totalReferralAmount: referralStats.totalReferralAmount,
        totalReferralUsers: referralStats.totalReferralUsers,
        totalReferralTransactions: referralStats.totalReferralTransactions,
      },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
