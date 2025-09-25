const express = require("express");
const router = express.Router();

const userRouter = require("./settings");
const adminRouter = require("./settingsAdmin");

router.use("/user", userRouter);
router.use("/admin", adminRouter);

module.exports = router;
