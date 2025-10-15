const express = require("express");
const router = express.Router();
const SettingsRepository = require("../../model/settings/index");
const { setApiResponse } = require("../../utils/setApiResponse");
const fileUploader = require("../../utils/fileUploader");
// Create or update settings
router.post(
  "/",
  fileUploader("setting", [{ name: "qrImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      console.log("djjhgv", req.body);
      // Handle uploaded QR image
      if (req.files && req.files.qrImage && req.files.qrImage[0]) {
        req.body.qrCode = `${req.files.qrImage[0].destination}/${req.files.qrImage[0].filename}`;
      }

      const setting = await SettingsRepository.createSetting(req.body);
      return setApiResponse(200, true, setting, null, res);
    } catch (error) {
      return setApiResponse(500, false, null, error.message, res);
    }
  }
);

// Get all settings
router.get("/", async (req, res) => {
  try {
    const settings = await SettingsRepository.getAllSettings();
    return setApiResponse(200, true, settings, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
