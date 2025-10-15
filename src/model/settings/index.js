const dbClient = require("./settings");

// Create or update the universal setting (only one allowed)
const createSetting = async (settingData) => {
  console.log("setting", settingData);
  return await dbClient.findOneAndUpdate({}, settingData, {
    upsert: true,
    new: true,
  });
};

// Get all settings
const getAllSettings = async () => {
  return await dbClient.findOne();
};

module.exports = {
  createSetting,
  getAllSettings,
};
