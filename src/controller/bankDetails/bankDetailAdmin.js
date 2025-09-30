const express = require("express");
const router = express.Router();
const BankDetailRepository = require("../../model/bankDetail/index");
const { setApiResponse } = require("../../utils/setApiResponse");
// const { authenticateAdmin } = require('../../middleware/adminAuthMiddleware')

// Get all bank details with user information and search functionality
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.trim(),
      status,
    };

    const result = await BankDetailRepository.getAllBankDetailsWithUser(
      options
    );

    return setApiResponse(200, true, result, null, res);
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get bank detail by ID with user information
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bankDetail = await BankDetailRepository.getBankDetailById(id);
    if (!bankDetail) {
      return setApiResponse(404, false, null, "Bank detail not found", res);
    }

    // Populate user information
    await bankDetail.populate("userId", "userName fullName email mobile");

    return setApiResponse(200, true, bankDetail, null, res);
  } catch (error) {
    console.error("Error fetching bank detail:", error);
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Update bank detail status (activate/deactivate)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return setApiResponse(
        400,
        false,
        null,
        "isActive must be a boolean value",
        res
      );
    }

    const bankDetail = isActive
      ? await BankDetailRepository.activateBankDetail(id)
      : await BankDetailRepository.deactivateBankDetail(id);

    return setApiResponse(
      200,
      true,
      bankDetail,
      `Bank detail ${isActive ? "activated" : "deactivated"} successfully`,
      res
    );
  } catch (error) {
    console.error("Error updating bank detail status:", error);
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Delete bank detail permanently
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBankDetail = await BankDetailRepository.deleteBankDetail(id);

    return setApiResponse(
      200,
      true,
      deletedBankDetail,
      "Bank detail deleted successfully",
      res
    );
  } catch (error) {
    console.error("Error deleting bank detail:", error);
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get bank details statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const activeBankDetails = await BankDetailRepository.getActiveBankDetails();
    const inactiveBankDetails =
      await BankDetailRepository.getInactiveBankDetails();
    const allBankDetails = await BankDetailRepository.getAllBankDetails();

    const stats = {
      total: allBankDetails.length,
      active: activeBankDetails.length,
      inactive: inactiveBankDetails.length,
    };

    return setApiResponse(
      200,
      true,
      stats,
      "Bank details statistics retrieved successfully",
      res
    );
  } catch (error) {
    console.error("Error fetching bank details statistics:", error);
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
