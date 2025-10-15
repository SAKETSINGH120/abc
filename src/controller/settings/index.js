const express = require("express");
const router = express.Router();

const userRouter = require("./settings");
const adminRouter = require("./settingsAdmin");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");
const { authenticateUser } = require("../../middleware/userAuthMiddleware");

router.use("/user", authenticateUser, userRouter);
router.use("/admin", authenticateAdmin, adminRouter);

module.exports = router;
