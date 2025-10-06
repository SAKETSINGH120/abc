const BankDetail = require("./bankDetail");

// Create a new bank detail
const createBankDetail = async (bankData) => {
  try {
    const bankDetail = new BankDetail(bankData);
    return await bankDetail.save();
  } catch (error) {
    throw new Error(`Error creating bank detail: ${error.message}`);
  }
};

// Get all bank details with optional filters
const getAllBankDetails = async (filter = {}) => {
  try {
    return await BankDetail.find(filter).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching bank details: ${error.message}`);
  }
};

// Get bank detail by ID
const getBankDetailById = async (bankDetailId) => {
  try {
    const bankDetail = await BankDetail.findById(bankDetailId);
    if (!bankDetail) {
      throw new Error("Bank detail not found");
    }
    return bankDetail;
  } catch (error) {
    throw new Error(`Error fetching bank detail: ${error.message}`);
  }
};

// Get bank detail by account number
const getBankDetailByAccountNumber = async (accountNumber) => {
  try {
    return await BankDetail.findOne({ accountNumber, isActive: true });
  } catch (error) {
    throw new Error(
      `Error fetching bank detail by account number: ${error.message}`
    );
  }
};

// Get bank details by IFSC code
const getBankDetailsByIFSC = async (ifscCode) => {
  try {
    return await BankDetail.find({ ifscCode, isActive: true }).sort({
      createdAt: -1,
    });
  } catch (error) {
    throw new Error(`Error fetching bank details by IFSC: ${error.message}`);
  }
};

// Get bank details by bank name
const getBankDetailsByBankName = async (bankName) => {
  try {
    return await BankDetail.find({
      bankName: { $regex: bankName, $options: "i" },
      isActive: true,
    }).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(
      `Error fetching bank details by bank name: ${error.message}`
    );
  }
};

// Update bank detail by ID
const updateBankDetail = async (bankDetailId, updateData) => {
  try {
    const bankDetail = await BankDetail.findByIdAndUpdate(
      bankDetailId,
      updateData,
      { new: true, runValidators: true }
    );
    if (!bankDetail) {
      throw new Error("Bank detail not found");
    }
    return bankDetail;
  } catch (error) {
    throw new Error(`Error updating bank detail: ${error.message}`);
  }
};

// Soft delete bank detail (set isActive to false)
const deactivateBankDetail = async (bankDetailId) => {
  try {
    const bankDetail = await BankDetail.findByIdAndUpdate(
      bankDetailId,
      { isActive: false },
      { new: true }
    );
    if (!bankDetail) {
      throw new Error("Bank detail not found");
    }
    return bankDetail;
  } catch (error) {
    throw new Error(`Error deactivating bank detail: ${error.message}`);
  }
};

// Activate bank detail
const activateBankDetail = async (bankDetailId) => {
  try {
    const bankDetail = await BankDetail.findByIdAndUpdate(
      bankDetailId,
      { isActive: true },
      { new: true }
    );
    if (!bankDetail) {
      throw new Error("Bank detail not found");
    }
    return bankDetail;
  } catch (error) {
    throw new Error(`Error activating bank detail: ${error.message}`);
  }
};

// Hard delete bank detail (permanent deletion)
const deleteBankDetail = async (bankDetailId) => {
  try {
    const bankDetail = await BankDetail.findByIdAndDelete(bankDetailId);
    if (!bankDetail) {
      throw new Error("Bank detail not found");
    }
    return bankDetail;
  } catch (error) {
    throw new Error(`Error deleting bank detail: ${error.message}`);
  }
};

// Get active bank details only
const getActiveBankDetails = async () => {
  try {
    return await BankDetail.find({ isActive: true }).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching active bank details: ${error.message}`);
  }
};

// Get inactive bank details only
const getInactiveBankDetails = async () => {
  try {
    return await BankDetail.find({ isActive: false }).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching inactive bank details: ${error.message}`);
  }
};

// Search bank details by account holder name
const searchBankDetailsByHolderName = async (holderName) => {
  try {
    return await BankDetail.find({
      accountHolderName: { $regex: holderName, $options: "i" },
      isActive: true,
    }).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(
      `Error searching bank details by holder name: ${error.message}`
    );
  }
};

// Get bank details with pagination
const getBankDetailsWithPagination = async (options = {}) => {
  try {
    const { page = 1, limit = 10, filter = {} } = options;
    const skip = (page - 1) * limit;

    const bankDetails = await BankDetail.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await BankDetail.countDocuments(filter);

    return {
      bankDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(
      `Error fetching bank details with pagination: ${error.message}`
    );
  }
};

// Check if account number already exists
const checkAccountNumberExists = async (accountNumber, excludeId = null) => {
  try {
    const query = { accountNumber };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existingBankDetail = await BankDetail.findOne(query);
    return !!existingBankDetail;
  } catch (error) {
    throw new Error(
      `Error checking account number existence: ${error.message}`
    );
  }
};

// Get bank details by user ID
const getBankDetailsByUserId = async (userId) => {
  try {
    return await BankDetail.find({ userId, isActive: true }).sort({
      createdAt: -1,
    });
  } catch (error) {
    throw new Error(`Error fetching bank details by user ID: ${error.message}`);
  }
};

// Get all bank details with user information (for admin)
const getAllBankDetailsWithUser = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = options;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          // Include all bank detail fields except user
          accountHolderName: 1,
          bankName: 1,
          accountNumber: 1,
          ifscCode: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          // Only include user's firstName and mobile
          "user.firstName": 1,
          "user.number": 1,
        },
      },
    ];

    // Add search filter if provided
    if (search && search.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { accountHolderName: { $regex: search.trim(), $options: "i" } },
            { bankName: { $regex: search.trim(), $options: "i" } },
            { accountNumber: { $regex: search.trim(), $options: "i" } },
            { "user.firstName": { $regex: search.trim(), $options: "i" } },
            { "user.number": { $regex: search.trim(), $options: "i" } },
          ],
        },
      });
    }

    // Add status filter
    if (status === "active") {
      pipeline.push({ $match: { isActive: true } });
    } else if (status === "inactive") {
      pipeline.push({ $match: { isActive: false } });
    }

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    // Execute aggregation
    const bankDetails = await BankDetail.aggregate(pipeline);

    return bankDetails;
  } catch (error) {
    throw new Error(
      `Error fetching bank details with user info: ${error.message}`
    );
  }
};

module.exports = {
  createBankDetail,
  getAllBankDetails,
  getBankDetailById,
  getBankDetailByAccountNumber,
  getBankDetailsByIFSC,
  getBankDetailsByBankName,
  updateBankDetail,
  deactivateBankDetail,
  activateBankDetail,
  deleteBankDetail,
  getActiveBankDetails,
  getInactiveBankDetails,
  searchBankDetailsByHolderName,
  getBankDetailsWithPagination,
  checkAccountNumberExists,
  getBankDetailsByUserId,
  getAllBankDetailsWithUser,
};
