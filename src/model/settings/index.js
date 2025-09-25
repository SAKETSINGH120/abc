const dbClient = require("./settings");

// Create or update the universal setting (only one allowed)
const createSetting = async (settingData) => {
  return await dbClient.findOneAndUpdate({}, settingData, {
    upsert: true,
    new: true,
  });
};

// Get all settings
const getAllSettings = async () => {
  return await dbClient.find({});
};

const getLockedPeriod = async () => {
  const result = await dbClient.findOne();
  return result;
};

const getReferralPercetage = async () => {
  const result = await dbClient.findOne();
  return result?.referralCommissionPercentage || 0;
};

module.exports = {
  createSetting,
  getAllSettings,
  getLockedPeriod,
  getReferralPercetage,
};
