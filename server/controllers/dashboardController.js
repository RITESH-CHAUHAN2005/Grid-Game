const { findById } = require("../models/userModel");
const { GameData } = require("../models/gameDataModel");

async function getDashboard(req, res, next) {
  try {
    const user = await findById(req.user.id);
    const statsDoc = await GameData.findOne({ userId: req.user.id })
      .select("tiles wins matches")
      .lean();
    res.json({
      message: "Welcome to Grid Dominion",
      user,
      stats: statsDoc || { tiles: 0, wins: 0, matches: 0 },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getDashboard };
