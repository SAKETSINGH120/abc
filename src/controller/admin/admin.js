const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Admin = require("../../model/admin/admin");
const generateToken = require("../../utils/generateToken");
const { setApiResponse } = require("../../utils/setApiResponse");
const { authenticateAdmin } = require("../../middleware/adminAuthMiddleware");

router.post("/signup", async (req, res, next) => {
  try {
    let { name, email, phoneNo, password } = req.body || {};

    if (!name) {
      return setApiResponse(400, false, null, "Name is required", res);
    }

    if (!email) {
      return setApiResponse(400, false, null, "Email is required", res);
    }

    if (!password || password.length < 6) {
      return setApiResponse(
        400,
        false,
        null,
        "Password is required and must be at least 6 characters",
        res
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return setApiResponse(400, false, null, "Admin already exists", res);
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({ name, email, phoneNo, password: hashedPassword });
    await admin.save();

    // Remove password from response
    const adminResponse = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      phoneNo: admin.phoneNo,
    };

    return setApiResponse(201, true, adminResponse, null, res);
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    let { email, password } = req.body || {};

    console.log("djghjgkjdgjkndg", email);

    if (!email || !password) {
      return setApiResponse(
        400,
        false,
        null,
        "Email and password are required",
        res
      );
    }

    const admin = await Admin.findOne({ email: email });

    console.log("admin", admin);

    if (!admin) {
      return setApiResponse(404, false, null, "Admin not found", res);
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return setApiResponse(401, false, null, "Invalid email or password", res);
    }

    const token = generateToken({ admin, role: "admin" });

    return setApiResponse(
      200,
      true,
      {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phoneNo: admin.phoneNo,
        },
        token,
      },
      null,
      res
    );
  } catch (error) {
    return setApiResponse(500, false, null, error.message, res);
  }
});

router.post("/change-password", authenticateAdmin, async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword, email } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return setApiResponse(
      400,
      false,
      null,
      "Current password, new password and confirm password are required",
      res
    );
  }

  if (newPassword !== confirmPassword) {
    return setApiResponse(400, false, null, "New passwords do not match", res);
  }

  if (currentPassword === newPassword) {
    return setApiResponse(
      400,
      false,
      null,
      "New password must be different from current password",
      res
    );
  }

  try {
    // ✅ Get user by id
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return setApiResponse(404, false, null, "User not found", res);
    }

    // ✅ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid) {
      return setApiResponse(
        401,
        false,
        null,
        "Current password is incorrect",
        res
      );
    }

    // ✅ Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update user password
    admin.password = hashedNewPassword;
    await admin.save();

    return setApiResponse(
      200,
      true,
      null,
      "Password changed successfully",
      res
    );
  } catch (error) {
    console.error("Change password error:", error.message);
    return next(error);
  }
});

module.exports = router;
