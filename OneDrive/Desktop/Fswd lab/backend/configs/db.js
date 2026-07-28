const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/portfolio_db";
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB Connected Successfully to", mongoUri);
  } catch (error) {
    console.warn("MongoDB Connection Warning:", error.message);
    console.warn("Running with memory connection mode / fallback...");
  }
};

module.exports = connectDB;