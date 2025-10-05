const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const router = express.Router();
const BetRepository = require("../../model/bet/index");
const GameRepository = require("../../model/game/index");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");
const userWalletRespository = require("../../model/userWallet/walletIndex");
const WalletHistoryRepository = require("../../model/walletHistory/index");

// Get user's bets
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { status, betType, gameId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (betType) filter.betType = betType;
    if (gameId) filter.gameId = gameId;

    const bets = await BetRepository.getBetsByUser(req.user.id, filter);
    return setApiResponse(200, true, bets, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Place a new bet
// router.post("/", authenticateUser, async (req, res) => {
//   console.log(req.user.userId);
//   try {
//     const { gameId, betType, subBetType, number, amount } = req.body || {};

//     // Validate required fields
//     if (!gameId || !betType || !number || !amount) {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "gameId, betType, number, and amount are required",
//         res
//       );
//     }

//     // Validate subBetType for JANTARY
//     if (betType === "JANTARY" && !subBetType) {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "subBetType is required for JANTARY bets",
//         res
//       );
//     }

//     // Validate amount
//     if (amount <= 0) {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "Amount must be greater than 0",
//         res
//       );
//     }

//     // Check if game exists and is open
//     const game = await GameRepository.getGameById(gameId);
//     if (!game) {
//       return setApiResponse(404, false, null, "Game not found", res);
//     }

//     if (game.status !== "open") {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "Game is not open for betting",
//         res
//       );
//     }

//     // Check if current time is before close time
//     const now = new Date();
//     if (now >= new Date(game.closeTime)) {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "Betting time has ended for this game",
//         res
//       );
//     }

//     // Check user wallet balance
//     const userWallet = await userWalletRespository.getUserWallet(
//       req.user.userId
//     );
//     if (!userWallet) {
//       return setApiResponse(404, false, null, "User wallet not found", res);
//     }

//     if (userWallet.totalBalance < amount) {
//       return setApiResponse(
//         400,
//         false,
//         null,
//         "Insufficient wallet balance",
//         res
//       );
//     }

//     // Validate bet type and number format
//     const betValidation = validateBetTypeAndNumber(betType, subBetType, number);
//     if (!betValidation.isValid) {
//       return setApiResponse(400, false, null, betValidation.message, res);
//     }

//     // Deduct amount from user wallet
//     const deductResult = await userWalletRespository.deductBalance(
//       req.user.userId,
//       amount
//     );

//     if (!deductResult) {
//       return setApiResponse(400, false, null, "Failed to deduct balance", res);
//     }

//     // Create wallet history for the bet
//     const walletHistoryData = {
//       userId: req.user.userId,
//       walletId: userWallet.userId,
//       transactionType: "DEBIT",
//       amount: amount,
//       status: "COMPLETED",
//       source: "GAME_BET",
//       referenceId: gameId,
//     };

//     try {
//       await WalletHistoryRepository.createWalletHistory(walletHistoryData);
//     } catch (historyError) {
//       console.error("Failed to create wallet history:", historyError.message);
//     }

//     const betData = {
//       userId: req.user.userId,
//       gameId,
//       betType,
//       subBetType: betType === "JANTARY" ? subBetType : undefined,
//       number,
//       amount,
//     };

//     const bet = await BetRepository.placeBet(betData);

//     return setApiResponse(201, true, bet, null, res);
//   } catch (error) {
//     return setApiResponse(500, false, null, error.message, res);
//   }
// });

// place bet
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { gameId, betType, subBets } = req.body || {};

    console.log("gameId, betType, subBets", gameId, betType, subBets);

    console.log("subBets", subBets);

    if (!gameId || !betType) {
      return setApiResponse(
        400,
        false,
        null,
        "gameId and betType are required",
        res
      );
    }

    // ✅ JANTARY special case
    if (betType === "JANTARY") {
      if (!Array.isArray(subBets) || subBets.length === 0) {
        return setApiResponse(
          400,
          false,
          null,
          "subBets are required for JANTARY",
          res
        );
      }
    }

    // Check game
    const game = await GameRepository.getGameById(gameId);
    if (!game) {
      return setApiResponse(404, false, null, "Game not found", res);
    }
    if (game.status !== "open") {
      return setApiResponse(
        400,
        false,
        null,
        "Game is not open for betting",
        res
      );
    }
    if (new Date() >= new Date(game.closeTime)) {
      return setApiResponse(
        400,
        false,
        null,
        "Betting time has ended for this game",
        res
      );
    }

    // Wallet check
    const userWallet = await userWalletRespository.getUserWallet(
      req.user.userId
    );
    if (!userWallet) {
      return setApiResponse(404, false, null, "User wallet not found", res);
    }

    // ✅ Calculate total amount for all subBets
    const totalAmount = subBets.reduce((sum, b) => sum + (b.amount || 0), 0);

    if (userWallet.totalBalance < totalAmount) {
      return setApiResponse(
        400,
        false,
        null,
        "Insufficient wallet balance",
        res
      );
    }

    // Deduct once for total
    const deductResult = await userWalletRespository.deductBalance(
      req.user.userId,
      totalAmount
    );
    if (!deductResult) {
      return setApiResponse(400, false, null, "Failed to deduct balance", res);
    }

    // Wallet history
    try {
      await WalletHistoryRepository.createWalletHistory({
        userId: req.user.userId,
        walletId: userWallet.userId,
        transactionType: "DEBIT",
        amount: totalAmount,
        status: "COMPLETED",
        source: "GAME_BET",
        referenceId: gameId,
      });
    } catch (err) {
      console.error("Wallet history error:", err.message);
    }

    // ✅ Place each bet separately
    // const betResults = [];
    // for (const sub of subBets) {
    //   const { subBetType, number, amount } = sub;

    //   // Validate bet
    //   const betValidation = validateBetTypeAndNumber(
    //     betType,
    //     subBetType,
    //     number
    //   );
    //   console.log("betValidation.isValid", betValidation.isValid);
    //   if (!betValidation.isValid) {
    //     continue;
    //   }

    //   const bet = await BetRepository.placeBet({
    //     userId: req.user.userId,
    //     gameId,
    //     betType,
    //     subBetType,
    //     number,
    //     amount,
    //   });
    //   console.log("come");
    //   betResults.push(bet);
    // }

    // ✅ Place all bets in parallel instead of one-by-one
    const betPromises = subBets.map(async (sub) => {
      const { subBetType, number, amount } = sub;

      // Validate
      const betValidation = validateBetTypeAndNumber(
        betType,
        subBetType,
        number
      );
      if (!betValidation.isValid) return null;

      return await BetRepository.placeBet({
        userId: req.user.userId,
        gameId,
        betType,
        subBetType,
        number,
        amount,
      });
    });

    // Wait for all to finish
    const betResults = (await Promise.all(betPromises)).filter(Boolean);

    console.log("jkdhjkdgkd", betResults);

    return setApiResponse(201, true, betResults, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get user's participated bet history
router.get("/history", authenticateUser, async (req, res) => {
  try {
    const { status, betType, gameId, startDate, endDate } = req.query;

    const filter = { userId: req.user.userId };

    if (status) filter.status = status;
    if (betType) filter.betType = betType;
    if (gameId) filter.gameId = gameId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const betHistory = await BetRepository.getBetHistory(filter);
    return setApiResponse(200, true, betHistory, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get user's betting statistics
router.get("/stats", authenticateUser, async (req, res) => {
  try {
    const stats = await BetRepository.getUserBetStats(req.user.id);
    return setApiResponse(200, true, stats, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get user's winning bets
router.get("/winnings", authenticateUser, async (req, res) => {
  console.log("req.user.userId", req.user.userId);

  try {
    const winnings = await BetRepository.getUserWinningBets(req.user.userId);
    return setApiResponse(200, true, winnings, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get single bet details
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const bet = await BetRepository.getBetById(req.params.id);

    // Check if bet belongs to the authenticated user
    if (bet.userId.toString() !== req.user.id) {
      return setApiResponse(403, false, null, "Access denied", res);
    }

    return setApiResponse(200, true, bet, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Helper function to validate bet type and number format
function validateBetTypeAndNumber(betType, subBetType, number) {
  // Convert number to string for validation
  const numberStr = number.toString();

  // For JANTARY bet type, validate based on subBetType
  if (betType === "JANTARY") {
    console.log("subBet", subBetType);
    if (!subBetType) {
      return {
        isValid: false,
        message: "subBetType is required for JANTARY bets",
      };
    }

    // switch (subBetType) {
    //   case "JODI":
    //     if (!/^[0-9]{2}$/.test(numberStr) || number < 0 || number > 99) {
    //       return {
    //         isValid: false,
    //         message: "JODI bet must be a two-digit number (00-99)",
    //       };
    //     }
    //     break;
    //   case "DHAI":
    //     if (!/^[0-9]$/.test(numberStr) || number < 0 || number > 9) {
    //       return {
    //         isValid: false,
    //         message: "DHAI bet must be a single digit (0-9)",
    //       };
    //     }
    //     break;
    //   case "OPEN":
    //     if (!/^[0-9]$/.test(numberStr) || number < 0 || number > 9) {
    //       return {
    //         isValid: false,
    //         message: "OPEN bet must be a single digit (0-9)",
    //       };
    //     }
    //     break;
    //   default:
    //     return { isValid: false, message: "Invalid subBetType for JANTARY" };
    // }

    switch (subBetType) {
      // case "JODI":
      //   if (!/^[0-9]{2}$/.test(numberStr) || number < 0 || number > 99) {
      //     return {
      //       isValid: false,
      //       message: "JODI bet must be a two-digit number (00-99)",
      //     };
      //   }
      //   break;
      case "JODI":
        // ✅ Updated: Allow any number from 1 to 100
        if (!/^\d{1,3}$/.test(numberStr) || number < 1 || number > 100) {
          return {
            isValid: false,
            message: "JODI bet must be a number between 1 and 100",
          };
        }
        break;
      case "DHAI":
        if (!/^[0-9]$/.test(numberStr) || number < 0 || number > 9) {
          return {
            isValid: false,
            message: "DHAI bet must be a single digit (0-9)",
          };
        }
        break;
      case "OPEN":
        if (!/^[0-9]$/.test(numberStr) || number < 0 || number > 9) {
          return {
            isValid: false,
            message: "OPEN bet must be a single digit (0-9)",
          };
        }
        break;
      default:
        return { isValid: false, message: "Invalid subBetType for JANTARY" };
    }
  }
  // For other bet types
  else if (betType === "CROSSING") {
    if (!/^[0-9]{1,3}$/.test(numberStr) || number < 0 || number > 999) {
      return {
        isValid: false,
        message: "CROSSING bet must be 1-3 digits (0-999)",
      };
    }
  } else if (betType === "NO-TO-NO") {
    if (!/^[0-9]{2}$/.test(numberStr) || number < 0 || number > 99) {
      return {
        isValid: false,
        message: "NO-TO-NO bet must be a two-digit number (00-99)",
      };
    }
  } else if (betType === "OPEN") {
    if (!/^[0-9]$/.test(numberStr) || number < 0 || number > 9) {
      return {
        isValid: false,
        message: "OPEN bet must be a single digit (0-9)",
      };
    }
  } else {
    return { isValid: false, message: "Invalid bet type" };
  }

  return { isValid: true };
}

module.exports = router;
