const mongoose = require("mongoose");

const userModelSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    password: {
      type: String,
      required: true,
      // select: false,
    },
    number: {
      type: String,
      required: true,
    },
    profile: {
      type: String,
    },
    isVerified: { type: Boolean, default: true },
    referralCode: { type: String, unique: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const UserDbClient = mongoose.model("User", userModelSchema);
module.exports = UserDbClient;
