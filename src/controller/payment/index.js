const express = require("express");
const router = express.Router();

const userRouter = require("./paymentUser");
const adminRouter = require("./paymentAdmin");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");

router.use("/user", userRouter);
router.use("/admin", authenticateAdmin, adminRouter);

module.exports = router;
