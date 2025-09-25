const express = require("express");
const router = express.Router();

const userRouter = require("./bankDetails");
const adminRouter = require("./bankDetailAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
