const express = require("express");
const router = express.Router();

const userWalletRouter = require("./userWallet");
const userWalletAdminRouter = require("./userWalletAdmin");

router.use("/user", userWalletRouter);
router.use("/admin", userWalletAdminRouter);

module.exports = router;
