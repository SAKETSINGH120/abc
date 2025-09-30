const { default: mongoose } = require("mongoose");
const Bet = require("./bet");
const { ITEMS_PER_PAGE } = require("../../constants");

// Create a new bet
const placeBet = async (betData) => {
  try {
    const bet = new Bet(betData);
    return await bet.save();
  } catch (error) {
    throw new Error(`Error placing bet: ${error.message}`);
  }
};

// Get all bets
const getAllBets = async (filter = {}, page) => {
  try {
    return await Bet.find(filter)
      .populate("userId", "firstName number")
      .populate("gameId", "name openTime closeTime status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
  } catch (error) {
    throw new Error(`Error fetching bets: ${error.message}`);
  }
};

// Get bet by ID
const getBetById = async (betId) => {
  try {
    const bet = await Bet.findById(betId)
      .populate("userId")
      .populate("gameId", "name openTime closeTime status result");
    if (!bet) {
      throw new Error("Bet not found");
    }
    return bet;
  } catch (error) {
    throw new Error(`Error fetching bet: ${error.message}`);
  }
};

// Get bets by user ID
const getBetsByUser = async (userId, filter = {}) => {
  try {
    return await Bet.find({ userId, ...filter })
      .populate("gameId", "name openTime closeTime status result")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching user bets: ${error.message}`);
  }
};

// Get bets by game ID
const getBetsByGame = async (gameId, filter = {}) => {
  try {
    return await Bet.find({ gameId, ...filter })
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching game bets: ${error.message}`);
  }
};

// Get pending bets for a specific game
const getPendingBetsByGame = async (gameId) => {
  try {
    return await Bet.find({
      gameId,
      status: "pending",
    }).populate("userId", "username number");
  } catch (error) {
    throw new Error(`Error fetching pending bets: ${error.message}`);
  }
};

// Update bet status
const updateBetStatus = async (betId, status, winAmount = 0) => {
  try {
    const validStatuses = ["pending", "won", "lost"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    return await Bet.findByIdAndUpdate(
      betId,
      { status, winAmount },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error updating bet status: ${error.message}`);
  }
};

// Process game results - update all bets for a game
const processGameResults = async (gameId, gameResult) => {
  try {
    const pendingBets = await getPendingBetsByGame(gameId);
    const updatePromises = [];
    const winningBets = [];

    for (const bet of pendingBets) {
      let isWin = false;
      let winAmount = 0;

      console.log("Processing bet:", bet);

      // Check if bet won based on bet type and game result
      // All bet types use the same game result number
      const gameResultNumber = gameResult.result || gameResult; // Handle both object and direct number
      const gameResultString = gameResultNumber.toString();

      switch (bet.betType) {
        case "JANTARY":
          // Handle JANTARY sub-types with specific logic
          switch (bet.subBetType) {
            case "JODI":
              // JODI: Exact match with full result
              isWin = parseInt(gameResultString) === bet.number;
              winAmount = isWin ? bet.amount * 98 : 0; // 1:90 ratio for jodi
              break;
            case "DHAI":
              // DHAI: Match with first digit of result
              const firstDigit = parseInt(gameResultString.charAt(0));
              isWin = firstDigit === bet.number;
              winAmount = isWin ? bet.amount * 98 : 0; // 1:120 ratio for dhai
              break;
            case "OPEN":
              // OPEN: Match with last digit of result
              const lastDigit = parseInt(
                gameResultString.charAt(gameResultString.length - 1)
              );
              isWin = lastDigit === bet.number;
              winAmount = isWin ? bet.amount * 98 : 0; // 1:9 ratio for open
              break;
          }
          break;
        // case "CROSSING":
        //   isWin = gameResultString === bet.number;
        //   winAmount = isWin ? bet.amount * 150 : 0; // 1:150 ratio for crossing
        //   break;
        // case "NO-TO-NO":
        //   isWin = gameResultString === bet.number;
        //   winAmount = isWin ? bet.amount * 200 : 0; // 1:200 ratio for no-to-no
        //   break;
        // case "OPEN":
        //   // OPEN as main type: Match with last digit
        //   const lastDigitMain = gameResultString.charAt(
        //     gameResultString.length - 1
        //   );
        //   isWin = lastDigitMain === bet.number;
        //   winAmount = isWin ? bet.amount * 9 : 0; // 1:9 ratio for open
        //   break;
      }

      const status = isWin ? "won" : "lost";

      // Update bet status
      updatePromises.push(updateBetStatus(bet._id, status, winAmount));

      // If user won, add to winning bets array for controller to handle
      if (isWin && winAmount > 0) {
        winningBets.push({
          userId: bet.userId,
          betId: bet._id,
          winAmount: winAmount,
          betType: bet.betType,
          subBetType: bet.subBetType,
          number: bet.number,
        });
      }
    }

    const updatedBets = await Promise.all(updatePromises);

    // Return both updated bets and winning bets info
    return {
      updatedBets,
      winningBets,
    };
  } catch (error) {
    throw new Error(`Error processing game results: ${error.message}`);
  }
};

// Get user betting statistics
const getUserBetStats = async (userid) => {
  const userId = new mongoose.Types.ObjectId(userid);
  try {
    const stats = await Bet.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    const totalBets = await Bet.countDocuments({ userId });
    const totalAmount = await Bet.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalWinnings = await Bet.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$winAmount" } } },
    ]);

    return {
      totalBets,
      totalAmount: totalAmount[0]?.total || 0,
      totalWinnings: totalWinnings[0]?.total || 0,
      statusBreakdown: stats,
    };
  } catch (error) {
    throw new Error(`Error fetching user bet stats: ${error.message}`);
  }
};

// Get game betting statistics
const getGameBetStats = async (gameId) => {
  try {
    const totalBets = await Bet.countDocuments({ gameId });
    const totalAmount = await Bet.aggregate([
      { $match: { gameId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const betTypeStats = await Bet.aggregate([
      { $match: { gameId } },
      {
        $group: {
          _id: "$betType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return {
      totalBets,
      totalAmount: totalAmount[0]?.total || 0,
      betTypeBreakdown: betTypeStats,
    };
  } catch (error) {
    throw new Error(`Error fetching game bet stats: ${error.message}`);
  }
};

// Get bets by date range
const getBetsByDateRange = async (startDate, endDate, filter = {}, page) => {
  try {
    return await Bet.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      ...filter,
    })
      .populate("userId", "username email")
      .populate("gameId", "name openTime closeTime status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
  } catch (error) {
    throw new Error(`Error fetching bets by date range: ${error.message}`);
  }
};

// Delete bet (admin only)
const deleteBet = async (betId) => {
  try {
    const bet = await Bet.findByIdAndDelete(betId);
    if (!bet) {
      throw new Error("Bet not found");
    }
    return bet;
  } catch (error) {
    throw new Error(`Error deleting bet: ${error.message}`);
  }
};

// Get winning bets for a user
const getUserWinningBets = async (userId) => {
  try {
    return await Bet.find({
      userId: userId,
      status: "won",
    })
      .populate("gameId", "name openTime closeTime")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching user winning bets: ${error.message}`);
  }
};

// Get bet history with filters (no pagination)
const getBetHistory = async (filter = {}) => {
  try {
    return await Bet.find(filter)
      .populate("userId", "firstName number")
      .populate("gameId", "name openTime closeTime status result")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching bet history: ${error.message}`);
  }
};

module.exports = {
  placeBet,
  getAllBets,
  getBetById,
  getBetsByUser,
  getBetsByGame,
  getPendingBetsByGame,
  updateBetStatus,
  processGameResults,
  getUserBetStats,
  getGameBetStats,
  getBetsByDateRange,
  deleteBet,
  getUserWinningBets,
  getBetHistory,
};
