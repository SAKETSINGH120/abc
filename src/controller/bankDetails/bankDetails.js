const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const router = express.Router();
const BankDetailRepository = require("../../model/bankDetail/index");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");

// Get user's bank details
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userBankDetails = await BankDetailRepository.getBankDetailsByUserId(
      req.user.userId
    );
    return setApiResponse(200, true, userBankDetails, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Create/Save new bank detail for user
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { accountNumber, accountHolderName, ifscCode, bankName, branch } =
      req.body || {};

    // Validate required fields
    if (
      !accountNumber ||
      !accountHolderName ||
      !ifscCode ||
      !bankName ||
      !branch
    ) {
      return setApiResponse(
        400,
        false,
        null,
        "accountNumber, accountHolderName, ifscCode, bankName, and branch are required",
        res
      );
    }

    // Check if user already has a bank detail
    const existingUserBankDetails =
      await BankDetailRepository.getBankDetailsByUserId(req.user.userId);
    if (existingUserBankDetails && existingUserBankDetails.length > 0) {
      return setApiResponse(
        400,
        false,
        null,
        "You already have a bank detail saved. Please update the existing one or delete it first.",
        res
      );
    }

    // Check if account number already exists globally
    const existingBankDetail =
      await BankDetailRepository.checkAccountNumberExists(accountNumber);
    if (existingBankDetail) {
      return setApiResponse(
        400,
        false,
        null,
        "Account number already exists",
        res
      );
    }

    // Create bank detail with user ID
    const bankDetailData = {
      userId: req.user.userId,
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      bankName: bankName.trim(),
      branch: branch.trim(),
    };

    const bankDetail = await BankDetailRepository.createBankDetail(
      bankDetailData
    );
    return setApiResponse(201, true, bankDetail, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Update user's bank detail
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const bankDetailId = req.params.id;
    const { accountNumber, accountHolderName, ifscCode, bankName, branch } =
      req.body;

    // Check if bank detail exists and belongs to user
    const existingBankDetail = await BankDetailRepository.getBankDetailById(
      bankDetailId
    );
    if (!existingBankDetail) {
      return setApiResponse(404, false, null, "Bank detail not found", res);
    }

    if (existingBankDetail.userId.toString() !== req.user.userId) {
      return setApiResponse(403, false, null, "Access denied", res);
    }

    // Check if new account number already exists (exclude current record)
    if (accountNumber && accountNumber !== existingBankDetail.accountNumber) {
      const accountExists = await BankDetailRepository.checkAccountNumberExists(
        accountNumber,
        bankDetailId
      );
      if (accountExists) {
        return setApiResponse(
          400,
          false,
          null,
          "Account number already exists",
          res
        );
      }
    }

    // Prepare update data
    const updateData = {};
    if (accountNumber) updateData.accountNumber = accountNumber.trim();
    if (accountHolderName)
      updateData.accountHolderName = accountHolderName.trim();
    if (ifscCode) updateData.ifscCode = ifscCode.trim().toUpperCase();
    if (bankName) updateData.bankName = bankName.trim();
    if (branch) updateData.branch = branch.trim();

    const updatedBankDetail = await BankDetailRepository.updateBankDetail(
      bankDetailId,
      updateData
    );
    return setApiResponse(
      200,
      true,
      updatedBankDetail,
      "Bank detail updated successfully",
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get single bank detail by ID (user's own)
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const bankDetail = await BankDetailRepository.getBankDetailById(
      req.params.id
    );

    if (!bankDetail) {
      return setApiResponse(404, false, null, "Bank detail not found", res);
    }

    // Check if bank detail belongs to user
    if (bankDetail.userId.toString() !== req.user.userId) {
      return setApiResponse(403, false, null, "Access denied", res);
    }

    return setApiResponse(200, true, bankDetail, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Delete/Deactivate user's bank detail
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const bankDetailId = req.params.id;

    // Check if bank detail exists and belongs to user
    const existingBankDetail = await BankDetailRepository.getBankDetailById(
      bankDetailId
    );
    if (!existingBankDetail) {
      return setApiResponse(404, false, null, "Bank detail not found", res);
    }

    if (existingBankDetail.userId.toString() !== req.user.userId) {
      return setApiResponse(403, false, null, "Access denied", res);
    }

    // Soft delete (deactivate)
    await BankDetailRepository.deactivateBankDetail(bankDetailId);
    return setApiResponse(
      200,
      true,
      null,
      "Bank detail deleted successfully",
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
