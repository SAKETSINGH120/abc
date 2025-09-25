const express = require("express");
const router = express.Router();

const userRouter = require("../controller/user/index");
const adminRouter = require("../controller/admin/admin");
const userWalletRouter = require("../controller/userWallet/walletIndex");
const cmsRouter = require("../controller/cms/index");
const settingsRouter = require("../controller/settings/index");
const gameRouter = require("../controller/game/index");
const betRouter = require("../controller/bet/index");
const bannerRouter = require("../controller/banner/index");
const paymentRouter = require("../controller/payment/index");
const bankDetailRouter = require("../controller/bankDetails/index");
const dashboardRouter = require("../controller/dashboard");

router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/user_wallet", userWalletRouter);
router.use("/cms", cmsRouter);
router.use("/settings", settingsRouter);
router.use("/game", gameRouter);
router.use("/bet", betRouter);
router.use("/banner", bannerRouter);
router.use("/payment", paymentRouter);
router.use("/bankDetail", bankDetailRouter);
router.use("/dashboard", dashboardRouter);

module.exports = router;
