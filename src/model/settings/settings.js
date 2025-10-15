const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    refferralAmount: { type: Number, required: true },
    qrCode: { Type: String },
    rateForJodi: { type: Number },
    rateForDhaiOpen: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
