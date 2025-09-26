const express = require("express");
const router = express.Router();
const GameRepository = require("../../model/game/index");
const GameResult = require("../../model/gameResult/gameResult");
const { setApiResponse } = require("../../utils/setApiResponse");
// const { authenticateAdmin } = require('../../middleware/adminAuthMiddleware')

// Get all games with their result
router.get("/", async (req, res) => {
  try {
    // Get all games
    const games = await GameRepository.getAllGames();
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get only today's declared results
    const results = await GameResult.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Map results by game id
    const resultMap = {};
    results.forEach((r) => {
      resultMap[r.game.toString()] = r.result;
    });

    // Attach result to each game (null if no result declared today)
    const gamesWithResult = games.map((game) => ({
      ...game.toObject(),
      result: resultMap[game._id.toString()] || null,
    }));

    return setApiResponse(200, true, gamesWithResult, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});
// Get all games
// router.get("/", async (req, res) => {
//   try {
//     const { status, date } = req.query;
//     let games;

//     if (date) {
//       const startDate = new Date(date);
//       const endDate = new Date(date);
//       endDate.setHours(23, 59, 59, 999);
//       games = await GameRepository.getGamesByDateRange(startDate, endDate);
//     } else if (status) {
//       games = await GameRepository.getAllGames({ status });
//     } else {
//       games = await GameRepository.getAllGames();
//     }

//     return setApiResponse(200, true, games, null, res);
//   } catch (error) {
//     return setApiResponse(500, false, null, error.message, res);
//   }
// });

// Get today's games
router.get("/today", async (req, res) => {
  try {
    const games = await GameRepository.getTodaysGames();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get active games
router.get("/active", async (req, res) => {
  try {
    const games = await GameRepository.getActiveGames();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get games with results
router.get("/results", async (req, res) => {
  try {
    const games = await GameRepository.getGamesWithResults();
    return setApiResponse(200, true, games, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get today's games that need results declared
router.get("/today/pending-results", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get today's closed games
    const todaysGames = await GameRepository.getGamesByDateRange(
      startOfDay,
      endOfDay
    );
    const closedGames = todaysGames.filter((game) => game.status === "closed");

    // Filter out games that already have results declared today
    const gamesWithoutResults = [];
    for (const game of closedGames) {
      const existingResult = await GameResult.findOne({
        game: game._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
      if (!existingResult) {
        gamesWithoutResults.push(game);
      }
    }

    return setApiResponse(200, true, gamesWithoutResults, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get single game by ID
router.get("/:id", async (req, res) => {
  try {
    const game = await GameRepository.getGameById(req.params.id);
    return setApiResponse(200, true, game, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Create new game
router.post("/", async (req, res) => {
  try {
    const { name, openTime, closeTime, resultTime } = req.body;

    if ((!name || !openTime || !closeTime, !resultTime)) {
      return setApiResponse(
        400,
        false,
        null,
        "name, openTime,closeTime , and resultTime are required",
        res
      );
    }

    // Prevent duplicate game name
    const existingGame = await GameRepository.getGameByName(name);
    if (existingGame) {
      return setApiResponse(
        400,
        false,
        null,
        "Game with this name already exists",
        res
      );
    }

    // No date conversion needed - keep as strings
    const game = await GameRepository.createGame({
      name,
      openTime,
      closeTime,
      resultTime,
    });

    return setApiResponse(201, true, game, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Update game status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return setApiResponse(400, false, null, "status is required", res);
    }

    const game = await GameRepository.updateGameStatus(req.params.id, status);
    if (!game) {
      return setApiResponse(404, false, null, "Game not found", res);
    }

    return setApiResponse(
      200,
      true,
      game,
      "Game status updated successfully",
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Update game timing
router.patch("/:id/timing", async (req, res) => {
  try {
    const { openTime, closeTime } = req.body;

    if (!openTime || !closeTime) {
      return setApiResponse(
        400,
        false,
        null,
        "openTime and closeTime are required",
        res
      );
    }

    const game = await GameRepository.updateGameTiming(
      req.params.id,
      new Date(openTime),
      new Date(closeTime)
    );

    if (!game) {
      return setApiResponse(404, false, null, "Game not found", res);
    }

    return setApiResponse(
      200,
      true,
      game,
      "Game timing updated successfully",
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Declare a game result
router.post("/:id/result", async (req, res) => {
  try {
    const { result } = req.body;
    const gameId = req.params.id;

    if (!result) {
      return setApiResponse(400, false, null, "result is required", res);
    }

    // Validate result is a number
    if (isNaN(result)) {
      return setApiResponse(
        400,
        false,
        null,
        "result must be a valid number",
        res
      );
    }

    // Fetch the existing game to check its status
    const existingGame = await GameRepository.getGameById(gameId);
    if (!existingGame) {
      return setApiResponse(404, false, null, "Game not found", res);
    }

    // Check if game status allows result declaration
    if (existingGame.status !== "closed") {
      return setApiResponse(
        400,
        false,
        null,
        "Game must be in 'closed' status to declare result",
        res
      );
    }

    // Check if result already exists for this game (with today's context)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const existingResult = await GameResult.findOne({
      game: gameId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingResult) {
      return setApiResponse(
        400,
        false,
        null,
        "Result already declared for this game today",
        res
      );
    }

    // Create GameResult entry
    const gameResult = new GameResult({
      game: gameId,
      result: Number(result),
    });
    await gameResult.save();

    // Update the game with result
    const game = await GameRepository.declareResult(gameId, Number(result));

    return setApiResponse(200, true, { game, gameResult }, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Delete game
router.delete("/:id", async (req, res) => {
  try {
    const game = await GameRepository.deleteGame(req.params.id);
    return setApiResponse(200, true, game, "Game deleted successfully", res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Close expired games (utility endpoint)
router.post("/close-expired", async (req, res) => {
  try {
    const result = await GameRepository.closeExpiredGames();
    return setApiResponse(
      200,
      true,
      { modifiedCount: result.modifiedCount },
      "Expired games closed successfully",
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Close expired games (utility endpoint)
// router.get("/gameResult/:gameId", async (req, res) => {
//   const gameId = req.params.gameId;
//   try {
//     const result = await GameResult.findById(gameId);
//     return setApiResponse(200, true, result, null, res);
//   } catch (error) {
//     return setApiResponse(500, false, null, error.message, res);
//   }
// });

module.exports = router;
