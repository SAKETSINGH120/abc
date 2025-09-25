const dbClient = require("./banner");

module.exports = {
  dbClient,
  async createBanner(data) {
    try {
      return await dbClient.create(data);
    } catch (err) {
      throw new Error("Error creating banner: " + err.message);
    }
  },
  async getAllBanners() {
    try {
      return await dbClient.find();
    } catch (err) {
      throw new Error("Error fetching banners: " + err.message);
    }
  },
  async getBannerById(id) {
    try {
      return await dbClient.findById(id);
    } catch (err) {
      throw new Error("Error fetching banner: " + err.message);
    }
  },
  async updateBanner(id, data) {
    try {
      return await dbClient.findByIdAndUpdate(id, data, { new: true });
    } catch (err) {
      throw new Error("Error updating banner: " + err.message);
    }
  },
  async deleteBanner(id) {
    try {
      return await dbClient.findByIdAndDelete(id);
    } catch (err) {
      throw new Error("Error deleting banner: " + err.message);
    }
  },
};
