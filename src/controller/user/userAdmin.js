const express = require("express");
const router = express.Router();
const userRespository = require("../../model/user/index");
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

module.exports = router;
