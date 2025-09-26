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
        console.log("referrer", referrer);
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
      console.log("user", user);
      // ✅ Generate user wallet after signup
      await userWalletRespository.createUserWallet({
        userId: user._id,
        totalBalance: 0,
        availableBalance: 0,
      });

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
router.get("/referrals", authenticateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get all users referred by this user
    const referredUsers = await userRespository.getUsersByReferredBy(userId);

    // Calculate total referrals
    const totalReferrals = referredUsers.length;

    // Prepare response data
    const referralData = {
      totalReferrals: totalReferrals,
      referrals: referredUsers.map((user) => ({
        id: user._id,
        firstName: user.firstName,
        number: user.number,
        joinedAt: user.createdAt,
        amount: 100,
      })),
    };

    return setApiResponse(200, true, referralData, null, res);
  } catch (error) {
    console.error("Get referrals error:", error.message);
    return next(error);
  }
});

module.exports = router;
