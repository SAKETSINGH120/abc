const express = require("express");
const router = express.Router();

const userRouter = require("./bet");
const adminRouter = require("./betAdmin");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");

router.use("/user", userRouter);
router.use("/admin", authenticateAdmin, adminRouter);

module.exports = router;
