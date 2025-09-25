const dbClient = require("./userWallet");

// Create a new user wallet
const createUserWallet = async (data) => {
  console.log("userId", data);
  try {
    const wallet = dbClient.create({
      userId: data.userId,
      totalBalance: data.totalBalance || 0,
    });

    return wallet?._id ? wallet : null;
  } catch (error) {
    throw new Error(`Failed to create user wallet: ${error.message}`);
  }
};

// Update existing user wallet with new coin purchase
const updateUserWallet = async (userId, data) => {
  try {
    const updatedWallet = await dbClient.findOneAndUpdate(
      { userId: userId },
      {
        $inc: {
          totalCoins: data.totalCoins,
          availableCoins: data.availableCoins,
          totalInvestedAmount: data.totalInvestedAmount,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedWallet) {
      throw new Error("User wallet not found");
    }

    return updatedWallet;
  } catch (error) {
    throw new Error(`Failed to update user wallet: ${error.message}`);
  }
};

// Add referral commission to user wallet
const addReferralCommission = async (userId, commissionData) => {
  console.log("totalBalance", commissionData.totalBalance);
  try {
    const updatedWallet = await dbClient.findOneAndUpdate(
      { userId: userId },
      {
        $inc: {
          totalBalance: commissionData.totalBalance || 0,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedWallet) {
      throw new Error("User wallet not found for referral commission");
    }

    return updatedWallet;
  } catch (error) {
    throw new Error(`Failed to add referral commission: ${error.message}`);
  }
};

// Deduct referral commission from user wallet
const deductReferralCommission = async (
  userId,
  commissionData,
  options = {}
) => {
  try {
    const updateOptions = { new: true, runValidators: true };
    if (options.session) updateOptions.session = options.session;

    const updatedWallet = await dbClient.findOneAndUpdate(
      { userId: userId },
      {
        $inc: {
          referralCoins: -(commissionData.referralCoins || 0), // Negative to deduct
        },
      },
      updateOptions
    );

    if (!updatedWallet) {
      throw new Error(
        "User wallet not found for referral commission deduction"
      );
    }

    return updatedWallet;
  } catch (error) {
    throw new Error(`Failed to deduct referral commission: ${error.message}`);
  }
};

// Get user wallet by user ID
const getUserWallet = async (userId) => {
  try {
    return await dbClient.findOne({ userId: userId });
  } catch (error) {
    throw new Error(`Failed to get user wallet: ${error.message}`);
  }
};

// Update wallet balance
const updateWalletBalance = async (userId, amount, operation = "add") => {
  try {
    const wallet = await dbClient.findOne({ userId: userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (operation === "add") {
      wallet.totalBalance += amount;
    } else if (operation === "subtract") {
      if (wallet.totalBalance < amount) {
        throw new Error("Insufficient balance");
      }
      wallet.totalBalance -= amount;
    }

    return await wallet.save();
  } catch (error) {
    throw new Error(`Failed to update wallet balance: ${error.message}`);
  }
};

// Get wallet balance
const getWalletBalance = async (userId) => {
  try {
    const wallet = await dbClient.findOne({ userId: userId });
    return wallet ? wallet.totalBalance : 0;
  } catch (error) {
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
};

// Check if user has sufficient balance
const hasSufficientBalance = async (userId, amount) => {
  try {
    const balance = await getWalletBalance(userId);
    return balance >= amount;
  } catch (error) {
    throw new Error(`Failed to check balance: ${error.message}`);
  }
};

// Get all wallets with pagination
const getAllWallets = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    return await dbClient
      .find()
      .populate("user", "username email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Failed to get all wallets: ${error.message}`);
  }
};

// Deduct coins from availableCoins
const deductCoins = async (userId, coins, options = {}) => {
  try {
    const updateOptions = { new: true, runValidators: true };
    if (options.session) updateOptions.session = options.session;

    const updatedWallet = await dbClient.findOneAndUpdate(
      { userId: userId },
      {
        $inc: {
          availableCoins: -coins,
        },
      },
      updateOptions
    );

    if (!updatedWallet) {
      throw new Error("User wallet not found for deducting");
    }

    return updatedWallet;
  } catch (error) {
    throw new Error(`Failed to deduct: ${error.message}`);
  }
};

// Add coins to availableCoins
const addCoins = async (userId, coinsDetails, options = {}) => {
  try {
    const updateOptions = { new: true, runValidators: true };
    if (options.session) updateOptions.session = options.session;

    const updatedWallet = await dbClient.findOneAndUpdate(
      { userId: userId },
      {
        $inc: {
          totalCoins: coinsDetails.totalCoins,
          availableCoins: coinsDetails.availableCoins,
          totalInvestedAmount: coinsDetails.totalInvestedAmount,
        },
      },
      updateOptions
    );

    if (!updatedWallet) {
      throw new Error("User wallet not found for adding coins");
    }

    return updatedWallet;
  } catch (error) {
    throw new Error(`Failed to add coins: ${error.message}`);
  }
};

// Add only totalCoins and availableCoins
const addOnlyCoins = async (userId, coins, options = {}) => {
  try {
    const updateOptions = { new: true, runValidators: true };
    if (options.session) updateOptions.session = options.session;

    const updatedWallet = await dbClient.findOneAndUpdate(
      { userId: userId },
      {
        $inc: {
          totalCoins: coins,
          availableCoins: coins,
        },
      },
      updateOptions
    );

    if (!updatedWallet) {
      throw new Error("User wallet not found for adding only coins");
    }

    return updatedWallet;
  } catch (error) {
    throw new Error(`Failed to add only coins: ${error.message}`);
  }
};

const getTotalCommission = async (userId) => {
  try {
    const wallet = await dbClient.findOne({ userId: userId });
    console.log("wallet", wallet);
    return wallet ? Number(wallet.referralCoins) || 0 : 0;
  } catch (error) {
    throw new Error(`Failed to get total commission: ${error.message}`);
  }
};

// Deduct balance for bet placement
const deductBalance = async (userId, amount) => {
  try {
    const wallet = await dbClient.findOne({ userId });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.totalBalance < amount) {
      throw new Error("Insufficient balance");
    }

    wallet.totalBalance -= amount;

    await wallet.save();

    return wallet;
  } catch (error) {
    throw error;
  }
};

// Add balance to user wallet
const addBalance = async (userId, amount) => {
  try {
    const wallet = await dbClient.findOne({ userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    wallet.totalBalance += amount;
    await wallet.save();
    return wallet;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  //   UserWallet,
  createUserWallet,
  updateUserWallet,
  addReferralCommission,
  deductReferralCommission,
  getUserWallet,
  updateWalletBalance,
  getWalletBalance,
  hasSufficientBalance,
  getAllWallets,
  addCoins,
  deductCoins,
  addOnlyCoins,
  getTotalCommission,
  deductBalance,
  addBalance,
};
