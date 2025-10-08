const express = require("express");
const router = express.Router();

const userRouter = require("./game");
const adminRouter = require("./gameAdmin");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");

router.use("/user", userRouter);
router.use("/admin", authenticateAdmin, adminRouter);

module.exports = router;
