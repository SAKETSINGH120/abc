const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    refferralAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
