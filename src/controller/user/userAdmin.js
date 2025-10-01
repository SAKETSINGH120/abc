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
// router.get("/referrals/:userId", async (req, res, next) => {
//   try {
//     const userId = req.params.userId;
//     const { page, search } = req.query;

//     // Get all referral transactions from wallet history
//     const referralTransactions =
//       await walletHistoryRepository.getReferralTransactions(
//         userId,
//         parseInt(page),
//         search
//       );

//     // Calculate total referrals
//     const totalReferrals = referralTransactions.length;

//     // Prepare response data
//     const referralData = {
//       totalReferrals: totalReferrals,
//       referrals: referralTransactions.map((transaction) => ({
//         id: transaction._id,
//         firstName: transaction.userId ? transaction.userId.firstName : "N/A",
//         number: transaction.userId ? transaction.userId.number : "N/A",
//         joinedAt: transaction.createdAt,
//         amount: transaction.amount,
//       })),
//     };

//     return setApiResponse(200, true, referralData, null, res);
//   } catch (error) {
//     console.error("Get referrals error:", error.message);
//     return next(error);
//   }
// });

router.get("/referrals/:userId", async (req, res, next) => {
  console.log("🚀 REFERRALS ENDPOINT HIT - Starting...");
  try {
    console.log("come");
    console.log("🔐 Authenticated user:", req.user);
    const userId = req.params.userId;

    // Get all users who were referred by the current user
    const referredUsers = await userRespository.getUsersByReferredBy(userId);

    // Get referral commission transactions to get actual earnings
    const referralCommissions = await walletHistoryRepository.getWalletHistory({
      userId: userId,
      source: "REFERRAL",
      transactionType: "CREDIT",
      status: "COMPLETED",
    });

    console.log(
      "DEBUG - All referral transactions:",
      JSON.stringify(referralCommissions.history, null, 2)
    );
    console.log(
      "DEBUG - Referred users:",
      referredUsers.map((u) => ({ id: u._id, name: u.firstName }))
    );

    // Filter only commission transactions (not welcome bonus)
    // Commission transactions have referenceId as ObjectId (referred user ID)
    // Welcome bonus has referenceId like "REFERRAL_BONUS_xxxxx"
    const commissionTransactions = referralCommissions.history.filter(
      (tx) =>
        tx.referenceId &&
        !tx.referenceId.toString().startsWith("REFERRAL_BONUS_")
    );

    console.log(
      "DEBUG - Commission transactions:",
      JSON.stringify(commissionTransactions, null, 2)
    );

    // Calculate total earnings
    const totalEarnings = commissionTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    // Create a map of referenceId (referred user ID) to commission amount
    const commissionMap = {};
    commissionTransactions.forEach((tx) => {
      if (tx.referenceId) {
        // Try both string and ObjectId formats
        const refIdString = tx.referenceId.toString();
        commissionMap[refIdString] = tx.amount;
        commissionMap[tx.referenceId] = tx.amount;
      }
    });

    console.log("DEBUG - Commission map:", commissionMap);

    // Prepare response data with real commission amounts
    const referralData = {
      totalReferrals: referredUsers.length,
      // totalEarnings: totalEarnings,
      referrals: referredUsers.map((user) => {
        const userIdStr = user._id.toString();
        const commission =
          commissionMap[userIdStr] || commissionMap[user._id] || 0;

        return {
          id: user._id,
          firstName: user.firstName,
          number: user.number,
          joinedAt: user.createdAt,
          amount: commission,
        };
      }),
    };

    return setApiResponse(200, true, referralData, null, res);
  } catch (error) {
    console.error("Get referrals error:", error.message);
    return next(error);
  }
});

module.exports = router;
