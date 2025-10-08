const express = require("express");
const router = express.Router();

const userWalletRouter = require("./userWallet");
const userWalletAdminRouter = require("./userWalletAdmin");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");

router.use("/user", userWalletRouter);
router.use("/admin", authenticateAdmin, userWalletAdminRouter);

module.exports = router;
