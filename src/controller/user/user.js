const express = require("express");
const router = express.Router();
const userRespository = require("../../model/user/index");
const userWalletRespository = require("../../model/userWallet/walletIndex");
const walletHistoryRepository = require("../../model/walletHistory/index");
const bcrypt = require("bcrypt");
const generateToken = require("../../utils/generateToken");
const generateReferralCode = require("../../utils/generateReferralCode");
const fileUploader = require("../../utils/fileUploader");
const {
  userSignupValidator,
  userLoginValidator,
} = require("./validator/validator");
const { validateRequest } = require("../../utils/validateRequest");
const { setApiResponse } = require("../../utils/setApiResponse");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");

router.post(
  "/register",
  userSignupValidator,
  validateRequest,
  async (req, res, next) => {
    const { name, number, password, referralCode } = req.body;

    try {
      const existingUser = await userRespository.getUserByNumber(number);
      if (existingUser) {
        return setApiResponse(400, false, null, "user  already exists", res);
      }

      // ✅ Process referral BEFORE creating user
      let referredBy = null;
      if (referralCode) {
        const referrer = await userRespository.getUserByReferralCode(
          referralCode
        );

        if (referrer) {
          referredBy = referrer._id; // Use referrer's ID, not the code
        } else {
          return setApiResponse(400, false, null, "Invalid referral code", res);
        }
      }

      // ✅ Hash password and passcode
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Create user with all data including referral
      const user = await userRespository.createUser({
        firstName: name,
        password: hashedPassword,
        number,
        referralCode: generateReferralCode(name),
        referredBy: referredBy,
      });
      // ✅ Generate user wallet after signup
      await userWalletRespository.createUserWallet({
        userId: user._id,
        totalBalance: 0,
        availableBalance: 0,
      });

      // Add referral commission to both users (referrer and new user)
      try {
        const userWithReferral = await userRespository.getUserById(user._id);

        if (userWithReferral && userWithReferral.referredBy) {
          const referrerId = userWithReferral.referredBy;
          const commissionAmount = 100; // 100rs for referrer
          const newUserBonusAmount = 100; // 100rs bonus for new user

          console.log("Processing referral rewards for both users");

          // Add commission to referrer's wallet
          await userWalletRespository.addReferralCommission(referrerId, {
            totalBalance: commissionAmount,
          });

          // Add bonus to new user's wallet
          await userWalletRespository.addReferralCommission(user._id, {
            totalBalance: newUserBonusAmount,
          });

          // Create wallet history for referrer commission
          const referrerWallet = await userWalletRespository.getUserWallet(
            referrerId
          );
          if (referrerWallet) {
            await walletHistoryRepository.createWalletHistory({
              userId: referrerId,
              walletId: referrerWallet._id,
              transactionType: "CREDIT",
              amount: commissionAmount,
              status: "COMPLETED",
              source: "REFERRAL",
              referenceId: user._id,
              description: "Referral commission - friend joined",
            });
          }

          console.log("aaya idhr ");

          // Create wallet history for new user bonus
          const newUserWallet = await userWalletRespository.getUserWallet(
            user._id
          );

          console.log("jgggggdfgfd", newUserWallet);
          if (newUserWallet) {
            await walletHistoryRepository.createWalletHistory({
              userId: user._id,
              walletId: newUserWallet._id,
              transactionType: "CREDIT",
              amount: newUserBonusAmount,
              status: "COMPLETED",
              source: "REFERRAL",
              referenceId: `REFERRAL_BONUS_${user._id.toString()}`,
              description: "Welcome bonus - joined via referral",
            });
          }

          console.log(
            `✅ Referral rewards processed: ${commissionAmount}rs to referrer, ${newUserBonusAmount}rs to new user`
          );
        }
      } catch (referralError) {
        console.log("Referral commission error:", referralError.message);
        // Continue processing even if referral commission fails
      }

      // Generate JWT token for new user
      const token = generateToken({
        userId: user._id,
        number: user.number,
        firstName: user.firstName,
      });

      const responseData = {
        user: {
          id: user._id,
          firstName: user.firstName,
          number: user.number,
          referralCode: user.referralCode,
        },
        token,
      };

      return setApiResponse(200, true, responseData, null, res);
    } catch (error) {
      return next(error);
    }
  }
);

// Login endpoint
router.post(
  "/login",
  userLoginValidator,
  validateRequest,
  async (req, res, next) => {
    const { number, password } = req.body;

    try {
      const user = await userRespository.verifyPassword(number);

      if (!user) {
        return setApiResponse(404, false, null, "User not found", res);
      }

      // Check if user is verified
      if (!user.isVerified) {
        return setApiResponse(
          400,
          false,
          null,
          "Please verify your account first",
          res
        );
      }

      let isCredentialValid = false;

      console.log("dsjghdsjfhd", password, user.password);

      // Otherwise check password
      if (password) {
        isCredentialValid = await bcrypt.compare(password, user.password);
      }

      console.log("dsjghdsjfhd");
      if (!isCredentialValid) {
        return setApiResponse(401, false, null, "Invalid credentials", res);
      }

      // Generate JWT token
      const token = generateToken({
        userId: user._id,
        number: user.number,
        firstName: user.firstName,
      });

      const responseData = {
        user: {
          id: user._id,
          firstName: user.firstName,
          number: user.number,
        },
        token,
      };

      return setApiResponse(200, true, responseData, null, res);
    } catch (error) {
      return next(error);
    }
  }
);

// Get user profile endpoint
router.get("/profile", authenticateUser, async (req, res, next) => {
  const { userId } = req?.user;

  try {
    if (!userId) {
      return setApiResponse(400, false, null, "User ID is required", res);
    }

    const user = await userRespository.getUserProfile(userId);

    if (!user) {
      return setApiResponse(404, false, null, "User not found", res);
    }

    return setApiResponse(200, true, user, null, res);
  } catch (error) {
    return next(error);
  }
});

// Update user profile endpoint
router.put(
  "/profile",
  authenticateUser,
  fileUploader("user", [{ name: "profileImage", maxCount: 1 }]),
  async (req, res, next) => {
    const { userId } = req.user;
    const { firstName } = req.body || {};

    try {
      if (!userId) {
        return setApiResponse(400, false, null, "User ID is required", res);
      }

      // Prepare update object with only provided fields
      const updateData = {};
      if (firstName) updateData.firstName = firstName;

      // Handle profile image upload
      if (req.files && req.files.profileImage && req.files.profileImage[0]) {
        updateData.profile = `${req.files.profileImage[0].destination}/${req.files.profileImage[0].filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        return setApiResponse(
          400,
          false,
          null,
          "No valid fields to update",
          res
        );
      }

      const updatedUser = await userRespository.updateUserProfile(
        userId,
        updateData
      );

      if (!updatedUser) {
        return setApiResponse(404, false, null, "User not found", res);
      }

      return setApiResponse(200, true, updatedUser, null, res);
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/change-password", authenticateUser, async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const { userId } = req.user;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return setApiResponse(
      400,
      false,
      null,
      "Current password, new password and confirm password are required",
      res
    );
  }

  if (newPassword !== confirmPassword) {
    return setApiResponse(400, false, null, "New passwords do not match", res);
  }

  if (currentPassword === newPassword) {
    return setApiResponse(
      400,
      false,
      null,
      "New password must be different from current password",
      res
    );
  }

  try {
    // ✅ Get user by id
    const user = await userRespository.getUserById(userId);
    if (!user) {
      return setApiResponse(404, false, null, "User not found", res);
    }

    // ✅ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return setApiResponse(
        401,
        false,
        null,
        "Current password is incorrect",
        res
      );
    }

    // ✅ Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update user password
    user.password = hashedNewPassword;
    await user.save();

    return setApiResponse(
      200,
      true,
      null,
      "Password changed successfully",
      res
    );
  } catch (error) {
    console.error("Change password error:", error.message);
    return next(error);
  }
});

// Get all referrals for authenticated user
// router.get("/referrals", authenticateUser, async (req, res, next) => {
//   try {
//     const { userId } = req.user;

//     // Get all referral transactions from wallet history
//     const referralTransactions =
//       await walletHistoryRepository.getReferralTransactions(userId);

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
router.get("/referrals", authenticateUser, async (req, res, next) => {
  console.log("🚀 REFERRALS ENDPOINT HIT - Starting...");
  try {
    console.log("come");
    console.log("🔐 Authenticated user:", req.user);
    const { userId } = req.user;

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
      totalEarnings: totalEarnings,
      referrals: referredUsers.map((user) => {
        const userIdStr = user._id.toString();
        const commission =
          commissionMap[userIdStr] || commissionMap[user._id] || 0;

        return {
          id: user._id,
          firstName: user.firstName,
          number: user.number,
          joinedAt: user.createdAt,
          commissionEarned: commission,
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
