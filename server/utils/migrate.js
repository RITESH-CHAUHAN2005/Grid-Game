// Run with: node utils/migrate.js
// Syncs MongoDB indexes for all models.
const { connectDB } = require("../config/db");
const { User } = require("../models/userModel");
const { Session } = require("../models/sessionModel");
const { GameData } = require("../models/gameDataModel");
const { ActivityLog } = require("../models/activityLogModel");

(async () => {
  try {
    await connectDB();
    await Promise.all([
      User.syncIndexes(),
      Session.syncIndexes(),
      GameData.syncIndexes(),
      ActivityLog.syncIndexes(),
    ]);
    console.log("✅ MongoDB indexes synced.");
  } catch (e) {
    console.error("❌ Migration failed:", e);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();
