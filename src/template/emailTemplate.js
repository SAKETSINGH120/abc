function adminPasswordChangeOtpTemplate({ adminName, otp }) {
  return baseTemplate(`
    <h2 style="color: #e6a500;">Admin Password Change Verification</h2>
    <p>Dear ${adminName || "Admin"},</p>
    <p>To confirm your password change, please use the OTP below:</p>
    <div style="font-size: 2em; font-weight: bold; color: #e6a500; margin: 16px 0;">${otp}</div>
    <p>This OTP is valid for 10 minutes. If you did not request a password change, please contact support immediately.</p>
    <br>
    <p>Thanks,<br>The Bharat Digital Coin Team</p>
  `);
}
function resetPasswordOtpTemplate({ username, otp }) {
  return baseTemplate(`
    <h2 style="color: #2d7ff9;">Password Reset Request</h2>
    <p>Hi ${username || "User"},</p>
    <p>You requested to reset your password. Please use the OTP below to proceed:</p>
    <div style="font-size: 2em; font-weight: bold; color: #2d7ff9; margin: 16px 0;">${otp}</div>
    <p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
    <br>
    <p>Thanks,<br>The Bharat Digital Coin Team</p>
  `);
}

function adminPasswordChangeTemplate({ adminName, changedAt }) {
  return baseTemplate(`
    <h2 style="color: #e6a500;">Admin Password Changed</h2>
    <p>Dear ${adminName || "Admin"},</p>
    <p>Your password was successfully changed on <b>${
      changedAt ? new Date(changedAt).toLocaleString() : "recently"
    }</b>.</p>
    <p>If you did not perform this action, please contact support immediately.</p>
    <br>
    <p>Thanks,<br>The Bharat Digital Coin Team</p>
  `);
}
function baseTemplate(content) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 12px rgba(0,0,0,0.1);">
      <div style="background: #f4c430; color: #333333; padding: 15px; text-align: center; font-size: 20px;">
        Bharat Digital Coin
      </div>
      <div style="padding: 20px; color: #333333; font-size: 15px; line-height: 1.6;">
        ${content}
      </div>
      <div style="background: #f1f1f1; color: #666; padding: 10px; text-align: center; font-size: 12px;">
        © ${new Date().getFullYear()} Bharat Digital Coin. All rights reserved.
      </div>
    </div>
  </div>
  `;
}

function welcomeTemplate(name) {
  return baseTemplate(`
    <h2>Hello ${name},</h2>
    <p>🎉 Welcome to <b>Bharat Digital Coin</b>!</p>
    <p>We're excited to have you onboard. Start your journey with secure and reliable digital coin investments.</p>
    <p style="margin-top:20px;">
      <a href="https://bharatdigitalcoins.com" style="background: #e6a500; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Get Started</a>
    </p>
  `);
}

function otpTemplate(name, otp) {
  return baseTemplate(`
     <h2>Hello ${name},</h2>
    <p>Your One Time Password (OTP) for <b>Bharat Digital Coin</b> is:</p>
    <h1 style="text-align:center; letter-spacing:5px;">${otp}</h1>
    <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
    <p>If you did not request this, please ignore this email or contact Bharat Digital Coin support immediately.</p>
  `);
}

function transactionTemplate(name, amount, type) {
  return baseTemplate(`
    <h2>Hello ${name},</h2>
    <p>Your <b>${type}</b> transaction of <b>₹${amount}</b> has been processed successfully.</p>
    <p>You can check your transaction history in your dashboard.</p>
  `);
}

module.exports = {
  welcomeTemplate,
  otpTemplate,
  transactionTemplate,
  resetPasswordOtpTemplate,
  adminPasswordChangeTemplate,
  adminPasswordChangeOtpTemplate,
};
