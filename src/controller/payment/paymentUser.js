const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const router = express.Router();
const PaymentRepository = require("../../model/payment/index");
const fileUploader = require("../../utils/fileUploader");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");
const userWalletRepository = require("../../model/userWallet/walletIndex");
const walletHistoryRepository = require("../../model/walletHistory/index");
const bankDetail = require("../../model/bankDetail/bankDetail");

// Get all payments for the logged-in user
router.get("/", authenticateUser, async (req, res) => {
  try {
    let query = {};
    // Assuming req.user.id is set by authentication middleware
    const userId = req.user?.userId;
    const { status, page, type } = req.query;

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (!userId) {
      return setApiResponse(401, false, null, "User not authenticated", res);
    }
    const payments = await PaymentRepository.getAllPayments(
      query,
      parseInt(page),
      userId
    );
    return setApiResponse(200, true, payments, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get withdrawal requests for the logged-in user
router.get("/withdrawals", authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return setApiResponse(401, false, null, "User not authenticated", res);
    }
    const withdrawals = await PaymentRepository.getAllPayments({
      userId,
      type: "WITHDRAWL",
    });
    return setApiResponse(200, true, withdrawals, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get deposit requests for the logged-in user
router.get("/deposits", async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return setApiResponse(401, false, null, "User not authenticated", res);
    }
    const deposits = await PaymentRepository.getAllPayments({
      userId,
      type: "ADD",
    });
    return setApiResponse(200, true, deposits, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// create payment
router.post(
  "/",
  authenticateUser,
  fileUploader("payment", [{ name: "paymentImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { amount } = req.body || {};
      const { userId } = req.user;

      if (!userId || !amount || !req.files) {
        return setApiResponse(
          400,
          false,
          null,
          "userId, amount, paymentImage are required",
          res
        );
      }
      let paymentImage;
      if (req.files && req.files.paymentImage && req.files.paymentImage[0]) {
        paymentImage = `${req.files.paymentImage[0].destination}/${req.files.paymentImage[0].filename}`;
      }
      const payment = await PaymentRepository.createPayment({
        userId,
        amount,
        paymentImage,
        type: "ADD", // Specify this is a deposit
        status: "pending",
      });
      return setApiResponse(200, true, payment, null, res);
    } catch (error) {
      return setApiResponse(500, false, null, error.message, res);
    }
  }
);

// User withdrawal request API
router.post("/withdraw", authenticateUser, async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      paymentRecieveNumber,
      bankDetails = "",
    } = req.body;
    // Get userId from authentication middleware if available
    console.log(
      "hgkfjdghjfdgj",
      amount,
      paymentMethod,
      paymentRecieveNumber,
      bankDetails,
      req.body
    );
    const userId = req.user?.userId;
    if (!userId || !amount) {
      return setApiResponse(
        400,
        false,
        null,
        "userId and amount are required",
        res
      );
    }

    // Check if user has sufficient balance
    const userWallet = await userWalletRepository.getUserWallet(userId);
    if (!userWallet) {
      return setApiResponse(404, false, null, "User wallet not found", res);
    }
    if (userWallet.totalBalance < amount) {
      return setApiResponse(
        400,
        false,
        null,
        "Insufficient wallet balance",
        res
      );
    }

    // Create payment record for withdrawal request
    const withdrawalPayment = await PaymentRepository.createPayment({
      userId,
      amount,
      paymentImage: "",
      type: "WITHDRAWL",
      paymentMethod: paymentMethod || "Bank Transfer",
      status: "pending",
      paymentNumber: paymentRecieveNumber || "",
      bankDetails: bankDetails || "",
    });

    // Deduct the amount and create wallet history in parallel
    const [_, withdrawRequestdetails] = await Promise.all([
      userWalletRepository.deductBalance(userId, amount),
      walletHistoryRepository.createWalletHistory({
        userId,
        walletId: userWallet._id,
        transactionType: "DEBIT",
        amount,
        status: "PENDING",
        source: "WITHDRAWAL",
        referenceId: withdrawalPayment._id, // Link to payment record
      }),
    ]);

    return setApiResponse(
      201,
      true,
      {
        withdrawal: withdrawRequestdetails,
        payment: withdrawalPayment,
        message: "Withdrawal request submitted successfully",
      },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
