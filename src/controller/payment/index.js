const express = require("express");
const router = express.Router();

const userRouter = require("./paymentUser");
const adminRouter = require("./paymentAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
