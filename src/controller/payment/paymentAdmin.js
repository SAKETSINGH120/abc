const express = require("express");
const router = express.Router();
const PaymentRepository = require("../../model/payment/index");
const { setApiResponse } = require("../../utils/setApiResponse");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");
const userWalletRepository = require("../../model/userWallet/walletIndex");
const walletHistoryRepository = require("../../model/walletHistory/index");
const userRepository = require("../../model/user/index");

// Get all payments
router.get("/", async (req, res) => {
  const { status, type, page } = req.query;

  console.log("statusfdgfd", status, type);

  let query = {};

  if (status) {
    query.status = status;
  }
  if (type) {
    query.type = type;
  }
  console.log("query", query);
  try {
    const payments = await PaymentRepository.getAllPayments(
      query,
      parseInt(page),
      ""
    );
    return setApiResponse(200, true, payments, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Process payment: approve and add amount to user wallet using repository
router.post("/process/:id", async (req, res) => {
  console.log("hello");
  try {
    const paymentId = req.params.id;
    // Find the payment
    const payment = await PaymentRepository.getPaymentById(paymentId);
    if (!payment) {
      return setApiResponse(404, false, null, "Payment not found", res);
    }
    if (payment.status === "approved") {
      return setApiResponse(400, false, null, "Payment already approved", res);
    }

    // Update payment status and add amount to user's wallet in parallel
    let userWallet = await userWalletRepository.getUserWallet(payment.userId);
    if (!userWallet) {
      return setApiResponse(404, false, null, "User wallet not found", res);
    }
    payment.status = "approved";
    await Promise.all([
      PaymentRepository.changePaymentStatus(paymentId, "approved"),
      userWalletRepository.addBalance(payment.userId, payment.amount),
    ]);

    // Create wallet history record
    await walletHistoryRepository.createWalletHistory({
      userId: payment.userId,
      walletId: userWallet._id,
      transactionType: "CREDIT",
      amount: payment.amount,
      status: "COMPLETED",
      source: "DEPOSIT",
      referenceId: payment._id.toString(),
    });

    return setApiResponse(200, true, payment, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Process withdrawal request: approve and mark as completed
// router.post("/process-withdraw/:id", authenticateAdmin, async (req, res) => {
//   try {
//     const withdrawId = req.params.id;
//     // Find the payment
//     const withdrawReq = await walletHistoryRepository.getTransactionById(
//       withdrawId
//     );
//     if (!withdrawReq) {
//       return setApiResponse(
//         404,
//         false,
//         null,
//         "Withdrawal request not found",
//         res
//       );
//     }
//     if (withdrawReq.status === "COMPLETED") {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "Withdrawal already processed",
//         res
//       );
//     }
//     if (withdrawReq.transactionType !== "WITHDRAWAL") {
//       return setApiResponse(400, false, null, "Not a withdrawal request", res);
//     }

//     // Update wallet history status to COMPLETED for this withdrawal
//     await walletHistoryRepository.updateTransactionStatus(
//       withdrawReq._id.toString(),
//       "COMPLETED"
//     );

//     return setApiResponse(
//       200,
//       true,
//       { message: "Withdrawal processed successfully", paymentId },
//       null,
//       res
//     );
//   } catch (error) {
//     return setApiResponse(500, false, null, error.message, res);
//   }
// });

router.post("/process-withdraw/:id", authenticateAdmin, async (req, res) => {
  try {
    const withdrawId = req.params.id;
    // Find the payment
    const withdrawReq = await PaymentRepository.getPaymentById(withdrawId);
    if (!withdrawReq) {
      return setApiResponse(
        404,
        false,
        null,
        "Withdrawal request not found",
        res
      );
    }
    if (withdrawReq.status === "approved") {
      return setApiResponse(
        400,
        false,
        null,
        "Withdrawal already processed",
        res
      );
    }
    if (withdrawReq.type !== "WITHDRAWAL") {
      return setApiResponse(400, false, null, "Not a withdrawal request", res);
    }

    // Update wallet history status to COMPLETED for this withdrawal
    await walletHistoryRepository.updateTransactionStatus(
      withdrawReq._id.toString(),
      "COMPLETED"
    );

    return setApiResponse(
      200,
      true,
      { message: "Withdrawal processed successfully" },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
