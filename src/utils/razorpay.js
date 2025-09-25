const Razorpay = require("razorpay");

const razorpayInstanse = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID_TEST,
  key_secret: process.env.RAZOR_KEY_SECRET_TEST,
});

module.exports = razorpayInstanse;
