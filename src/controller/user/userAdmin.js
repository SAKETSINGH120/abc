const express = require("express");
const router = express.Router();
const userRespository = require("../../model/user/index");
const walletHistoryRepository = require("../../model/walletHistory/index");
const { setApiResponse } = require("../../utils/setApiResponse");

router.get("/list", async (req, res, next) => {
  const { search, page = 1 } = req.query;
  try {
    const users = await userRespository.getAllUsers(search, parseInt(page));

    if (!users || users.length === 0) {
      return setApiResponse(404, false, null, "No users found", res);
    }

    // Format user data to exclude sensitive information
    const formattedUsers = users.map((user) => ({
      id: user._id,
      firstName: user.firstName,
      number: user.number || "",
      isVerified: user.isVerified,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return setApiResponse(200, true, formattedUsers, null, res);
  } catch (error) {
    return next(error);
  }
});

router.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await userRespository.getUserById(userId);
    if (!user) {
      return setApiResponse(404, false, null, "User not found", res);
    }
    // Format user data to exclude sensitive information
    const formattedUser = {
      id: user._id,
      firstName: user.firstName,
      number: user.number || "",
      isVerified: user.isVerified,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return setApiResponse(200, true, formattedUser, null, res);
  } catch (error) {
    return next(error);
  }
});

// Update user by ID (Admin)
router.put("/:userId", async (req, res, next) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (Object.keys(updateData).length === 0) {
      return setApiResponse(400, false, null, "No valid fields to update", res);
    }

    const updatedUser = await userRespository.updateUserById(
      userId,
      updateData
    );

    // Format response to exclude sensitive information
    const formattedUser = {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      number: updatedUser.number || "",
      isVerified: updatedUser.isVerified,
      referralCode: updatedUser.referralCode,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return setApiResponse(
      200,
      true,
      formattedUser,
      "User updated successfully",
      res
    );
  } catch (error) {
    return next(error);
  }
});

// Delete user by ID (Admin)
router.delete("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    const deletedUser = await userRespository.deleteUserById(userId);

    // Format response to exclude sensitive information
    const formattedUser = {
      id: deletedUser._id,
      firstName: deletedUser.firstName,
      number: deletedUser.number || "",
      isVerified: deletedUser.isVerified,
      profile: deletedUser.profile,
    };

    return setApiResponse(
      200,
      true,
      formattedUser,
      "User deleted successfully",
      res
    );
  } catch (error) {
    return next(error);
  }
});
// Get all referrals for authenticated user
router.get("/allReferrals/all", async (req, res, next) => {
  try {
    const { page = 1, search } = req.query;
    console.log("jkgdsjkgdksjgb", page);

    // Get all referral transactions across all users
    const result = await walletHistoryRepository.getAllReferralTransactions({
      page: parseInt(page),
      search: search,
    });
    // Prepare response data
    const referralData = {
      referrals: result.transactions.map((transaction) => ({
        id: transaction._id,
        firstName: transaction.userId ? transaction.userId.firstName : "N/A",
        number: transaction.userId ? transaction.userId.number : "N/A",
        joinedAt: transaction.createdAt,
        amount: transaction.amount,
        transactionDate: transaction.createdAt,
      })),
    };

    return setApiResponse(200, true, referralData, null, res);
  } catch (error) {
    console.error("Get all referrals error:", error.message);
    return next(error);
  }
});
// Get all referrals for authenticated user
router.get("/referrals/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { page, search } = req.query;

    // Get all referral transactions from wallet history
    const referralTransactions =
      await walletHistoryRepository.getReferralTransactions(
        userId,
        parseInt(page),
        search
      );

    // Calculate total referrals
    const totalReferrals = referralTransactions.length;

    // Prepare response data
    const referralData = {
      totalReferrals: totalReferrals,
      referrals: referralTransactions.map((transaction) => ({
        id: transaction._id,
        firstName: transaction.userId ? transaction.userId.firstName : "N/A",
        number: transaction.userId ? transaction.userId.number : "N/A",
        joinedAt: transaction.createdAt,
        amount: transaction.amount,
      })),
    };

    return setApiResponse(200, true, referralData, null, res);
  } catch (error) {
    console.error("Get referrals error:", error.message);
    return next(error);
  }
});

module.exports = router;
