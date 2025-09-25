const express = require("express");
const router = express.Router();

const userRouter = require("./bannerUser");
const adminRouter = require("./bannerAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
