const dbClient = require("./cms");

// Get CMS content (privacy policy and terms)
const getCMS = async () => {
  return dbClient.findOne();
};

// Update or create CMS content
const createCms = async ({ privacyPolicy, termsAndConditions, aboutUs }) => {
  return dbClient.findOneAndUpdate(
    {},
    { privacyPolicy, termsAndConditions, aboutUs },
    { upsert: true, new: true }
  );
};

module.exports = {
  getCMS,
  createCms,
};
