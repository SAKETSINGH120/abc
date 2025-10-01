const { ITEMS_PER_PAGE } = require("../../constants");
const WalletHistory = require("./walletHistory");

const createWalletHistory = async (data) => {
  const {
    userId,
    walletId,
    transactionType,
    amount,
    status = "COMPLETED",
    source,
    referenceId,
  } = data;

  const walletHistory = new WalletHistory({
    userId,
    walletId,
    transactionType,
    amount,
    status,
    source,
    referenceId,
  });

  return await walletHistory.save();
};

const getWalletHistory = async (filters = {}, options = {}) => {
  const {
    userId,
    walletId,
    transactionType,
    source,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = { ...filters, ...options };

  const query = {};

  if (userId) query.userId = userId;
  if (walletId) query.walletId = walletId;
  if (transactionType) query.transactionType = transactionType;
  if (source) query.source = source;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    WalletHistory.find(query)
      .populate("userId", "name email")
      .populate("walletId", "balance") //totalBalance
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    WalletHistory.countDocuments(query),
  ]);

  return {
    history,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getTransactionById = async (id) => {
  const transaction = await WalletHistory.findOne({ _id: id })
    .populate("userId", "name email")
    .populate("walletId", "totalBalance");

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

const getUserWalletSummary = async (userId, period = "month") => {
  const dateFilter = {};
  const now = new Date();

  switch (period) {
    case "day":
      dateFilter.$gte = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "week":
      dateFilter.$gte = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      dateFilter.$gte = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      dateFilter.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
  }

  const summary = await WalletHistory.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: dateFilter,
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: "$transactionType",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalCredit: 0,
    totalDebit: 0,
    creditCount: 0,
    debitCount: 0,
    netAmount: 0,
  };

  summary.forEach((item) => {
    if (item._id === "CREDIT") {
      result.totalCredit = item.totalAmount;
      result.creditCount = item.count;
    } else if (item._id === "DEBIT") {
      result.totalDebit = item.totalAmount;
      result.debitCount = item.count;
    }
  });

  result.netAmount = result.totalCredit - result.totalDebit;

  return result;
};

const updateTransactionStatus = async (transactionId, status) => {
  const validStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const updatedTransaction = await WalletHistory.findOneAndUpdate(
    { _id: transactionId },
    { status },
    { new: true }
  );

  if (!updatedTransaction) {
    throw new Error("Transaction not found");
  }

  return updatedTransaction;
};

const getTransactionsBySource = async (userId, source, options = {}) => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    WalletHistory.find({ userId, source })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    WalletHistory.countDocuments({ userId, source }),
  ]);

  return {
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// const getReferralTransactions = async (userId, page, search) => {
//   try {
//     // Get all referral transactions for the user
//     const referralTransactions = await WalletHistory.find({
//       userId: userId,
//       source: "REFERRAL",
//       status: "COMPLETED",
//     })
//       .populate("userId", "firstName number createdAt")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * ITEMS_PER_PAGE)
//       .limit(ITEMS_PER_PAGE);

//     return referralTransactions;
//   } catch (error) {
//     throw new Error(`Error fetching referral transactions: ${error.message}`);
//   }
// };

const getReferralTransactions = async (userId, page, search) => {
  try {
    // Create the base filter object
    let filter = {
      userId: userId,
      source: "REFERRAL",
      status: "COMPLETED",
    };

    // Add search condition if search term is provided
    if (search) {
      filter.$or = [
        { "userId.firstName": { $regex: search, $options: "i" } },
        { "userId.number": { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    // Get all referral transactions for the user
    const referralTransactions = await WalletHistory.find(filter)
      .populate("userId", "firstName number createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    return referralTransactions;
  } catch (error) {
    throw new Error(`Error fetching referral transactions: ${error.message}`);
  }
};

const getAllReferralTransactions = async ({ page, search }) => {
  try {
    // Create the base filter object for the referral transactions
    let filter = {
      source: "REFERRAL",
      status: "COMPLETED",
    };
    console.log("page in index", page);
    // Add search condition if search term is provided
    if (search) {
      filter.$or = [
        { "userId.firstName": { $regex: search, $options: "i" } }, // Search in firstName (case-insensitive)
        { "userId.number": { $regex: search, $options: "i" } }, // Search in number (case-insensitive)
      ];
    }

    // Get all referral transactions across all users
    const referralTransactions = await WalletHistory.find(filter)
      .populate("userId", "firstName number createdAt")
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip((page - 1) * ITEMS_PER_PAGE) // Pagination logic
      .limit(ITEMS_PER_PAGE); // Limit results per page

    return {
      transactions: referralTransactions,
    };
  } catch (error) {
    throw new Error(
      `Error fetching all referral transactions: ${error.message}`
    );
  }
};

const getReferralStatistics = async () => {
  try {
    // Get total referral amount and count
    const totalStats = await WalletHistory.aggregate([
      {
        $match: {
          source: "REFERRAL",
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
    ]);

    const stats = totalStats[0] || {
      totalAmount: 0,
      totalTransactions: 0,
      uniqueUsers: [],
    };

    return {
      totalReferralAmount: stats.totalAmount,
      totalReferralTransactions: stats.totalTransactions,
      totalReferralUsers: stats.uniqueUsers.length,
    };
  } catch (error) {
    throw new Error(`Error fetching referral statistics: ${error.message}`);
  }
};

module.exports = {
  createWalletHistory,
  getWalletHistory,
  getTransactionById,
  getUserWalletSummary,
  updateTransactionStatus,
  getTransactionsBySource,
  getReferralTransactions,
  getAllReferralTransactions,
  getReferralStatistics,
};
