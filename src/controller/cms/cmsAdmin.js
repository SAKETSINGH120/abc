const express = require("express");
const router = express.Router();
const CmsRepository = require("../../model/cms/index");
const { setApiResponse } = require("../../utils/setApiResponse");
// const { authenticateAdmin } = require('../../middleware/adminAuthMiddleware')

// Get CMS content
router.get("/", async (req, res) => {
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

// Update or create CMS content
router.post("/", async (req, res) => {
  try {
    const { privacyPolicy, termsAndConditions, aboutUs } = req.body || {};
    if (!privacyPolicy || !termsAndConditions || !aboutUs) {
      return setApiResponse(
        400,
        false,
        null,
        "privacyPolicy and termsAndConditions , aboutUs are required",
        res
      );
    }
    const cms = await CmsRepository.createCms({
      privacyPolicy,
      termsAndConditions,
      aboutUs,
    });
    return setApiResponse(200, true, cms, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
