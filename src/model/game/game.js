// models/Game.js
const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String, // e.g. "Kalyan Morning", "Kalyan Night"
      required: true,
    },
    openTime: {
      type: String, // Changed to String
      required: true,
    },
    closeTime: {
      type: String, // Changed to String
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "open", "closed", "declared"],
      default: "upcoming", // Change "open" to "closed" for default closed status
    },
    resultTime: {
      type: String, // Reverted back to String
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);
