const express = require("express");
const router = express.Router();
const BetRepository = require("../../model/bet/index");
const GameRepository = require("../../model/game/index"); // Add GameRepository
const UserWalletRepository = require("../../model/userWallet/walletIndex");
const WalletHistoryRepository = require("../../model/walletHistory/index");
const { setApiResponse } = require("../../utils/setApiResponse");
const GameResult = require("../../model/gameResult/gameResult");
// const { authenticateAdmin } = require('../../middleware/adminAuthMiddleware')

// Get all bets with optional filters
router.get("/", async (req, res) => {
  try {
    const {
      userId,
      gameId,
      status,
      betType,
      startDate,
      endDate,
      page = 1,
    } = req.query;
    let bets;
    if (startDate && endDate) {
      const filter = {};
      if (userId) filter.userId = userId;
      if (gameId) filter.gameId = gameId;
      if (status) filter.status = status;
      if (betType) filter.betType = betType;

      bets = await BetRepository.getBetsByDateRange(
        startDate,
        endDate,
        filter,
        parseInt(page)
      );
    } else {
      const filter = {};
      if (userId) filter.userId = userId;
      if (gameId) filter.gameId = gameId;
      if (status) filter.status = status;
      if (betType) filter.betType = betType;

      bets = await BetRepository.getAllBets(filter, parseInt(page));
    }

    return setApiResponse(200, true, bets, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get bet statistics for a specific game
router.get("/game/:gameId/stats", async (req, res) => {
  try {
    const stats = await BetRepository.getGameBetStats(req.params.gameId);
    return setApiResponse(200, true, stats, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get user betting statistics
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const stats = await BetRepository.getUserBetStats(req.params.userId);
    return setApiResponse(200, true, stats, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get bets by specific game
router.get("/game/:gameId", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const bets = await BetRepository.getBetsByGame(req.params.gameId, filter);
    return setApiResponse(200, true, bets, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get bets by specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { status, betType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (betType) filter.betType = betType;

    const bets = await BetRepository.getBetsByUser(req.params.userId, filter);
    return setApiResponse(200, true, bets, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get single bet details
router.get("/:id", async (req, res) => {
  try {
    const bet = await BetRepository.getBetById(req.params.id);
    return setApiResponse(200, true, bet, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Update bet status manually (admin override)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, winAmount } = req.body;

    if (!status) {
      return setApiResponse(400, false, null, "status is required", res);
    }

    const bet = await BetRepository.updateBetStatus(
      req.params.id,
      status,
      winAmount || 0
    );
    if (!bet) {
      return setApiResponse(404, false, null, "Bet not found", res);
    }

    return setApiResponse(
      200,
      true,
      bet,
      "Bet status updated successfully",
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Process game results - update all pending bets for a game
router.post("/game/:gameId/process-results", async (req, res) => {
  try {
    const gameId = req.params.gameId;

    // Fetch the game from database to get the actual result
    const game = await GameRepository.getGameById(gameId);
    if (!game) {
      return setApiResponse(404, false, null, "Game not found", res);
    }

    const gameResult = await GameResult.findOne({ game: gameId });
    if (!gameResult) {
      return setApiResponse(404, false, null, "GameResult not found", res);
    }
    console.log("gameResult", gameResult);
    // Check if game has a result declared
    if (!gameResult.result) {
      return setApiResponse(
        400,
        false,
        null,
        "Game result not declared yet. Please declare result first.",
        res
      );
    }

    // Check if game status is 'declared'
    if (game.status !== "declared") {
      return setApiResponse(
        400,
        false,
        null,
        "Game must be in 'declared' status to process results",
        res
      );
    }

    console.log(
      `Processing results for Game: ${game.name}, Result: ${game.result}`
    );

    // Process game results using the actual game result from database
    const result = await BetRepository.processGameResults(
      gameId,
      gameResult.result // Use the actual result from game
    );

    const { updatedBets, winningBets } = result;
    let creditedWinners = 0;
    let failedCredits = 0;

    // Process wallet credits for winning bets
    for (const winningBet of winningBets) {
      try {
        // Credit winnings to user wallet
        await UserWalletRepository.updateWalletBalance(
          winningBet.userId,
          winningBet.winAmount,
          "add"
        );

        // Create wallet history for the win
        const walletHistoryData = {
          userId: winningBet.userId,
          walletId: winningBet.userId,
          transactionType: "CREDIT",
          amount: winningBet.winAmount,
          status: "COMPLETED",
          source: "GAME_WIN",
          referenceId: req.params.gameId,
          description: `Won ${winningBet.betType} bet - ${winningBet.number}`,
        };

        await WalletHistoryRepository.createWalletHistory(walletHistoryData);
        creditedWinners++;

        console.log(
          `✅ Credited ${winningBet.winAmount} to user ${winningBet.userId} for winning ${winningBet.betType} bet`
        );
      } catch (walletError) {
        failedCredits++;
        console.error(
          `❌ Failed to credit winnings to user ${winningBet.userId}:`,
          walletError.message
        );
      }
    }
    // ✅ **Change game status back to 'upcoming' after processing results**
    // game.status = "upcoming";
    // await GameRepository.updateGameStatus(gameId, "upcoming");

    return setApiResponse(
      200,
      true,
      {
        gameId: gameId,
        gameName: game.name,
        gameResult: game.result,
        processedBets: updatedBets.length,
        totalWinners: winningBets.length,
        creditedWinners: creditedWinners,
        failedCredits: failedCredits,
        message: "Game results processed and wallets updated successfully",
      },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Delete bet (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const bet = await BetRepository.deleteBet(req.params.id);
    return setApiResponse(200, true, bet, "Bet deleted successfully", res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get pending bets for a specific game
router.get("/game/:gameId/pending", async (req, res) => {
  try {
    const bets = await BetRepository.getPendingBetsByGame(req.params.gameId);
    return setApiResponse(200, true, bets, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get all users' bet history (Admin only)
// router.get("/admin/history", authenticateUser, async (req, res) => {
//   try {
//     // Add admin check here if needed
//     // if (req.user.role !== 'admin') {
//     //   return setApiResponse(403, false, null, "Access denied", res);
//     // }

//     const {
//       page = 1,
//       limit = 10,
//       userId,
//       status,
//       betType,
//       gameId,
//       startDate,
//       endDate,
//       sortBy = "createdAt",
//       sortOrder = "desc",
//     } = req.query;

//     const filter = {};

//     if (userId) filter.userId = userId;
//     if (status) filter.status = status;
//     if (betType) filter.betType = betType;
//     if (gameId) filter.gameId = gameId;

//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) filter.createdAt.$gte = new Date(startDate);
//       if (endDate) filter.createdAt.$lte = new Date(endDate);
//     }

//     const options = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       sortBy,
//       sortOrder,
//     };

//     const betHistory = await BetRepository.getBetHistory(filter, options);

//     return setApiResponse(200, true, betHistory, null, res);
//   } catch (error) {
//     return setApiResponse(500, false, null, error.message, res);
//   }
// });

// for testing
router.get("/summary/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;

    // Get all bets for that game
    const bets = await BetRepository.getBetsByGame(gameId);

    if (!bets.length) {
      return res.status(404).json({ success: false, message: "No bets found" });
    }

    // Aggregation
    const numberWise = {};
    const typeWise = {};

    bets.forEach((bet) => {
      // Number wise aggregation
      if (!numberWise[bet.number]) {
        numberWise[bet.number] = {
          number: bet.number,
          betType: bet.betType,
          subBetType: bet.subBetType,
          totalAmount: 0,
        };
      }
      numberWise[bet.number].totalAmount += bet.amount;

      // SubBetType wise aggregation
      // if (!typeWise[bet.subBetType]) {
      //   typeWise[bet.subBetType] = {
      //     subBetType: bet.subBetType,
      //     totalAmount: 0,
      //   };
      // }
      // typeWise[bet.subBetType].totalAmount += bet.amount;
    });

    res.json({
      status: true,
      data: {
        numberWise: Object.values(numberWise),
        // typeWise: Object.values(typeWise),
        totalAmount: bets.reduce((sum, b) => sum + b.amount, 0),
      },
    });
  } catch (error) {
    console.error("Error in bets summary:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
