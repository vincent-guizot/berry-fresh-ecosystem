const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/berryfresh_articles', {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB (${error.message}). Running in mock fallback mode.`);
    return false;
  }
};

const getDbStatus = () => isConnected;

module.exports = { connectDB, getDbStatus };
