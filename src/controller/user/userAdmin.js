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

module.exports = router;
