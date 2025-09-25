const { ITEMS_PER_PAGE } = require("../../constants");
const dbClient = require("./user");

const createUser = async (data) => {
  const result = await dbClient.create({
    firstName: data?.firstName,
    password: data?.password,
    number: data?.number,
    profile: data?.profile || "",
    referralCode: data?.referralCode,
    referredBy: data?.referredBy,
  });

  return result?._id ? result : null;
};
const verifyPassword = async (number) => {
  const result = await dbClient.findOne({
    number: number,
  });

  if (!result) {
    return null;
  }
  return result;
};
const getUserProfile = async (userId) => {
  const result = await dbClient.findOne(
    {
      _id: userId,
    },
    {
      firstName: 1,
      email: 1,
      number: 1,
    }
  );

  if (!result) {
    return null;
  }
  return result;
};
const getUserByNumber = async (number) => {
  const result = await dbClient.findOne({
    number: number,
  });
  if (!result) {
    return null;
  }
  return result;
};
const getUserById = async (userId) => {
  const result = await dbClient.findById(userId);
  if (!result) {
    return null;
  }
  return result;
};

const updateUserProfile = async (userId, updateData) => {
  const result = await dbClient.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
      select: "firstName email profile _id createdAt updatedAt",
    }
  );

  if (!result) {
    return null;
  }
  return result;
};
// Get user by referral code
const getUserByReferralCode = async (referralCode) => {
  try {
    return await dbClient.findOne({ referralCode: referralCode });
  } catch (error) {
    throw new Error(`Failed to get user by referral code: ${error.message}`);
  }
};

// Get user by referral code
const getReferrerUser = async (referredId) => {
  try {
    return await dbClient.findOne({ _id: referredId });
  } catch (error) {
    throw new Error(`Failed to get user by referral code: ${error.message}`);
  }
};

const getAllUsers = async (search, page = 1) => {
  try {
    // Build filter for search if provided
    let filter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter = {
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
      };
    }
    const users = await dbClient
      .find(filter)
      .select("-password -passcode -otp -otpExpiresAt") // Exclude sensitive fields
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip((page - 1) * 25)
      .limit(25);
    return users;
  } catch (error) {
    throw error;
  }
};

const getTotalUserCount = async (search, page = 1) => {
  return await dbClient.countDocuments();
};

const getUserByUserId = async (userId) => {
  try {
    const user = await dbClient.findOne({ userId: userId });
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  verifyPassword,
  getUserProfile,
  getUserByNumber,
  updateUserProfile,
  getUserById,
  getUserByReferralCode,
  getReferrerUser,
  getAllUsers,
  getTotalUserCount,
  getUserByUserId,
};
