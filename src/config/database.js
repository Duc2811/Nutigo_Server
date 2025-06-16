const mongoose = require('mongoose')
require('dotenv').config()

module.exports.connect = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_DB || 'mongodb://mongodb:27017/nutigo';
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}