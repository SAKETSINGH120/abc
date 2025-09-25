function generateReferralCode(name) {
  const namePrefix = name.substring(0, 3).toUpperCase();

  // Generate random alphanumeric string (6 characters)
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomSuffix = "";

  for (let i = 0; i < 6; i++) {
    randomSuffix += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  // Combine name prefix with random suffix
  return `${namePrefix}${randomSuffix}`;
}

module.exports = generateReferralCode;
