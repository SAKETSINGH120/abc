const express = require("express");
const router = express.Router();
const BannerRepository = require("../../model/banner/index");
const { setApiResponse } = require("../../utils/setApiResponse");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");
const fileUploader = require("../../utils/fileUploader");

// Get all banners
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const banners = await BannerRepository.getAllBanners();
    return setApiResponse(200, true, banners, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Get banner by ID
router.get("/:id", authenticateAdmin, async (req, res) => {
  try {
    const banner = await BannerRepository.getBannerById(req.params.id);
    if (!banner) {
      return setApiResponse(404, false, null, "Banner not found", res);
    }
    return setApiResponse(200, true, banner, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

// Create banner
router.post(
  "/",
  authenticateAdmin,
  fileUploader("banner", [{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title } = req.body || {};
      const image = req.files?.image?.[0]?.filename;
      if (!title || !image) {
        return setApiResponse(
          400,
          false,
          null,
          "title and image are required",
          res
        );
      }
      const banner = await BannerRepository.createBanner({ title, image });
      return setApiResponse(200, true, banner, null, res);
    } catch (error) {
      return setApiResponse(500, false, null, error.message, res);
    }
  }
);

// Update banner
router.put(
  "/:id",
  authenticateAdmin,
  fileUploader("banner", [{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title } = req.body || {};
      let image = req.body.image;
      if (req.files?.image?.[0]?.filename) {
        image = req.files.image[0].filename;
      }
      if (!title || !image) {
        return setApiResponse(
          400,
          false,
          null,
          "title and image are required",
          res
        );
      }
      const banner = await BannerRepository.updateBanner(req.params.id, {
        title,
        image,
      });
      if (!banner) {
        return setApiResponse(404, false, null, "Banner not found", res);
      }
      return setApiResponse(200, true, banner, null, res);
    } catch (error) {
      return setApiResponse(500, false, null, error.message, res);
    }
  }
);

// Delete banner
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const banner = await BannerRepository.deleteBanner(req.params.id);
    if (!banner) {
      return setApiResponse(404, false, null, "Banner not found", res);
    }
    return setApiResponse(200, true, banner, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

module.exports = router;
