const express = require("express");
const { setApiResponse } = require("../../utils/setApiResponse");
const router = express.Router();
const CmsRepository = require("../../model/cms/index");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");

// Get CMS content
router.get("/", authenticateUser, async (req, res) => {
  try {
    const cms = await CmsRepository.getCMS();
    if (!cms) {
      return setApiResponse(404, false, null, "CMS content not found", res);
    }
    return setApiResponse(200, true, cms, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
