const express = require("express");
const router = express.Router();

const userRouter = require("./game");
const adminRouter = require("./gameAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
