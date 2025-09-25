const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const router = express.Router();
const GameRepository = require("../../model/game/index");
const GameResult = require("../../model/gameResult/gameResult");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");

// Get all active games for users
router.get("/", async (req, res) => {
  try {
    const games = await GameRepository.getAllGames();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});
// Get all active games for users
router.get("/all", async (req, res) => {
  try {
    const games = await GameRepository.getAllGamesWithName();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get today's games
router.get("/today", authenticateUser, async (req, res) => {
  try {
    const games = await GameRepository.getTodaysGames();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get games with results (for users to check results)
router.get("/results", async (req, res) => {
  try {
    const games = await GameRepository.getGamesWithResults();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get today's results only - latest first
router.get("/results/today", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get all static games (always available)
    const allGames = await GameRepository.getAllGames();

    // Get today's game results
    const todaysResults = await GameResult.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: "game",
        select: "_id",
      })
      .sort({ updatedAt: 1 }); // Latest first

    // Map gameId to today's result
    const resultMap = {};
    todaysResults.forEach((r) => {
      if (r.game && r.game._id) {
        resultMap[r.game._id.toString()] = {
          _id: r._id,
          result: r.result,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      }
    });

    // Attach today's result to each game (or null if no result declared today)
    const gamesWithResults = allGames.map((game) => ({
      _id: game._id,
      name: game.name,
      resultTime: game.resultTime,
      updatedAt: game.updatedAt,
      result: resultMap[game._id.toString()] || null,
    }));

    // Sort by result updatedAt (latest first), games with results first, then games without results
    gamesWithResults.sort((a, b) => {
      // If both have results, sort by result updatedAt (latest first)
      if (a.result && b.result) {
        return new Date(b.result.updatedAt) - new Date(a.result.updatedAt);
      }
      // Games with results come first
      if (a.result && !b.result) return -1;
      if (!a.result && b.result) return 1;
      // If both don't have results, maintain original order
      return 0;
    });

    return setApiResponse(200, true, gamesWithResults, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get all game results with latest first
router.get("/results/all", async (req, res) => {
  try {
    const { limit = 50, page = 1, startDate, endDate, name } = req.query;

    // Build filter object
    const filters = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    if (name) {
      filters.name = name;
    }

    // Get games with results, sorted by latest first
    const games = await GameRepository.getGameData(filters);

    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get single game details
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const game = await GameRepository.getGameById(req.params.id);
    return setApiResponse(200, true, game, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
