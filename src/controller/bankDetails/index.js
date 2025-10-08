const express = require("express");
const router = express.Router();

const userRouter = require("./bankDetails");
const adminRouter = require("./bankDetailAdmin");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");

router.use("/user", userRouter);
router.use("/admin", authenticateAdmin, adminRouter);

module.exports = router;
