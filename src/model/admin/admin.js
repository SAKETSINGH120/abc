const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    otpDetails: {
      otp: {
        type: String,
        default: "",
      },
      otpExpiry: {
        type: Date,
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
