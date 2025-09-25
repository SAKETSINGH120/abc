const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = generateOtp;
module.exports.generateOtpExpiry = generateOtpExpiry;
