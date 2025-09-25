const express = require("express");
const router = express.Router();
const SettingsRepository = require("../../model/settings/index");
const { setApiResponse } = require("../../utils/setApiResponse");

// Get all settings
router.get("/lockedPeriod", async (req, res) => {
  try {
    const settings = await SettingsRepository.getLockedPeriod();
    return setApiResponse(200, true, settings, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
