const mongoose = require("mongoose");
require("dotenv").config();

let connectPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is missing in environment variables");
    }

    connectPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  await connectPromise;
  return mongoose.connection;
}

mongoose.connection.on("error", (err) => {
  console.error("Unexpected MongoDB connection error:", err);
});

module.exports = { connectDB, mongoose };
