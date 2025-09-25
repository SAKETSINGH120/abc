const mongoose = require("mongoose");
const DATABASE_URL = process.env.DATABASE_URL;

const connectToDb = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Database Connecetion Error", error);
    process.exit(1);
  }
};
module.exports = connectToDb;
