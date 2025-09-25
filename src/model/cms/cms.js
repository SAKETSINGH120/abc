const mongoose = require("mongoose");

const cmsSchema = new mongoose.Schema(
  {
    privacyPolicy: {
      type: String,
      required: true,
    },
    termsAndConditions: {
      type: String,
      required: true,
    },
    aboutUs: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CMS", cmsSchema);
