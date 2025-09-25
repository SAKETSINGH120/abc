const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
  betType: {
    type: String,
    enum: ["JANTARY", "CROSSING", "NO-TO-NO", "OPEN"],
    required: true,
  },
  subBetType: {
    type: String,
    enum: ["JODI", "DHAI", "OPEN"],
    required: function () {
      return this.betType === "JANTARY";
    },
  },
  number: { type: Number, required: true }, // user ke chosen digits
  amount: { type: Number, required: true },
  winAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "won", "lost"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bet", betSchema);
