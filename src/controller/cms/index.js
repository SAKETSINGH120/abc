const express = require("express");
const router = express.Router();

const userRouter = require("./cms");
const adminRouter = require("./cmsAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
