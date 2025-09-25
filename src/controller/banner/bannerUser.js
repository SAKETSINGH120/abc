const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const router = express.Router();
const BannerRepository = require("../../model/banner/index");

// Get all active banners for users
router.get("/", async (req, res) => {
  try {
    // Only show active banners
    const banners = await BannerRepository.getAllBanners();
    return setApiResponse(200, true, banners, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
