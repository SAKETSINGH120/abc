const express = require("express");
const router = express.Router();

const userRouter = require("./bet");
const adminRouter = require("./betAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
