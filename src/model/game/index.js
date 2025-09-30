const Game = require("./game");
const GameResult = require("../../model/gameResult/gameResult");
const { ITEMS_PER_PAGE } = require("../../constants");

// Create a new game
const createGame = async (gameData) => {
  try {
    const game = new Game(gameData);
    return await game.save();
  } catch (error) {
    throw new Error(`Error creating game: ${error.message}`);
  }
};

// Get all games
const getAllGames = async (page = 1) => {
  try {
    return await Game.find()
      .sort({ openTime: 1 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
  } catch (error) {
    throw new Error(`Error fetching games: ${error.message}`);
  }
};

// Get all games
const getAllGamesWithoutPagination = async () => {
  try {
    return await Game.find().sort({ openTime: 1 });
  } catch (error) {
    throw new Error(`Error fetching games: ${error.message}`);
  }
};

// Get all games
const getAllGamesWithName = async (filter = {}) => {
  try {
    return await Game.find();
  } catch (error) {
    throw new Error(`Error fetching games: ${error.message}`);
  }
};

// Get game by ID
const getGameById = async (gameId) => {
  try {
    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    return game;
  } catch (error) {
    throw new Error(`Error fetching game: ${error.message}`);
  }
};

// Get active games (open status)
const getActiveGames = async () => {
  try {
    return await Game.find({ status: "open" }).sort({ openTime: 1 });
  } catch (error) {
    throw new Error(`Error fetching active games: ${error.message}`);
  }
};

// Update game status
const updateGameStatus = async (gameId, status) => {
  try {
    const validStatuses = ["open", "closed", "declared"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    return await Game.findByIdAndUpdate(
      gameId,
      { status },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error updating game status: ${error.message}`);
  }
};

// Declare game result
const declareResult = async (gameId) => {
  try {
    const game = await Game.findByIdAndUpdate(
      gameId,
      {
        status: "declared",
      },
      { new: true, runValidators: true }
    );

    if (!game) {
      throw new Error("Game not found");
    }

    return game;
  } catch (error) {
    throw new Error(`Error declaring result: ${error.message}`);
  }
};

// Get games by date range
const getGamesByDateRange = async (startDate, endDate) => {
  try {
    return await Game.find({
      openTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ openTime: 1 });
  } catch (error) {
    throw new Error(`Error fetching games by date range: ${error.message}`);
  }
};

// Get today's games
const getTodaysGames = async () => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await Game.find({
      openTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ openTime: 1 });
  } catch (error) {
    throw new Error(`Error fetching today's games: ${error.message}`);
  }
};

// Update game timing
const updateGameTiming = async (gameId, openTime, closeTime) => {
  try {
    return await Game.findByIdAndUpdate(
      gameId,
      { openTime, closeTime },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error updating game timing: ${error.message}`);
  }
};

// Update game by ID (General update function)
const updateGameById = async (gameId, updateData) => {
  try {
    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedGame) {
      throw new Error("Game not found");
    }

    return updatedGame;
  } catch (error) {
    throw new Error(`Error updating game: ${error.message}`);
  }
};

// Delete game
const deleteGame = async (gameId) => {
  try {
    const game = await Game.findByIdAndDelete(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    return game;
  } catch (error) {
    throw new Error(`Error deleting game: ${error.message}`);
  }
};

// Get games with results
const getGamesWithResults = async () => {
  try {
    return await Game.find({
      status: "declared",
      $or: [
        { "result.single": { $ne: null } },
        { "result.jodi": { $ne: null } },
        { "result.panna": { $ne: null } },
      ],
    }).sort({ openTime: -1 });
  } catch (error) {
    throw new Error(`Error fetching games with results: ${error.message}`);
  }
};

// Close expired games (games past their close time)
const closeExpiredGames = async () => {
  try {
    const now = new Date();
    return await Game.updateMany(
      {
        closeTime: { $lt: now },
        status: "open",
      },
      { status: "closed" }
    );
  } catch (error) {
    throw new Error(`Error closing expired games: ${error.message}`);
  }
};

// Get game by name
const getGameByName = async (name) => {
  try {
    return await Game.findOne({ name });
  } catch (error) {
    throw new Error(`Error fetching game by name: ${error.message}`);
  }
};

// Get all game results with latest first (with pagination and filters)
const getAllGameResults = async (options = {}) => {
  try {
    const { limit = 30, page = 1, filters = {} } = options;
    const skip = (page - 1) * limit;

    // Build query conditions
    const queryConditions = {
      status: "declared",
      result: { $ne: null }, // Only games with declared results
    };

    // Add date filtering if provided
    if (filters.startDate || filters.endDate) {
      queryConditions.updatedAt = {};

      if (filters.startDate) {
        queryConditions.updatedAt.$gte = filters.startDate;
      }

      if (filters.endDate) {
        // Set end date to end of day
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        queryConditions.updatedAt.$lte = endDate;
      }
    }

    // Add game name filtering if provided
    if (filters.gameName) {
      queryConditions.name = { $regex: filters.gameName, $options: "i" }; // Case-insensitive search
    }

    return await Game.find(queryConditions)
      .select(
        "name openTime closeTime resultTime result status createdAt updatedAt"
      ) // Select specific fields
      .sort({ updatedAt: -1, createdAt: -1 }) // Latest results first
      .limit(parseInt(limit))
      .skip(skip);
  } catch (error) {
    throw new Error(`Error fetching all game results: ${error.message}`);
  }
};

const getGameData = async ({ name, startDate, endDate }) => {
  try {
    // Initialize filter object for the GameResult collection
    let filter = {};

    // Step 1: Search for games by name (case-insensitive)
    if (name) {
      const games = await Game.find({
        name: { $regex: name, $options: "i" }, // Case-insensitive regex search for name
      }).select("_id"); // Only select the _id field

      // If no games found with that name, return an empty array
      if (games.length === 0) {
        return [];
      }

      // Step 2: Extract the game IDs
      const gameIds = games.map((game) => game._id);

      // Add the game filter to the GameResult filter
      filter.game = { $in: gameIds }; // Match GameResult where game._id is in the list of matching game IDs
    }

    // Step 3: Filter by date range (if provided)
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate), // Greater than or equal to startDate
        $lte: new Date(endDate), // Less than or equal to endDate
      };
    }

    // Step 4: Query GameResults with the constructed filter
    const gameResults = await GameResult.find(filter)
      .populate({
        path: "game", // Populate the "game" field in the GameResult schema
        model: "Game", // Reference to the Game model
        select: "name", // Fields to select from the Game model
      })
      .exec();

    return gameResults;
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw error;
  }
};

module.exports = {
  createGame,
  getAllGames,
  getGameById,
  getActiveGames,
  updateGameStatus,
  declareResult,
  getGamesByDateRange,
  getTodaysGames,
  updateGameTiming,
  updateGameById,
  deleteGame,
  getGamesWithResults,
  closeExpiredGames,
  getGameByName,
  getAllGameResults,
  getAllGamesWithName,
  getGameData,
  getAllGamesWithoutPagination,
};
