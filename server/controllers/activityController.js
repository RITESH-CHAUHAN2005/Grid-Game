const { ActivityLog } = require("../models/activityLogModel");

async function listMyActivity(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const before = req.query.before ? new Date(req.query.before) : null;

    const filter = { userId: req.user.id };
    if (before && !Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      activity: logs.map((l) => ({
        id: String(l._id),
        action: l.action,
        meta: l.meta || {},
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

async function listGlobalFeed(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const logs = await ActivityLog.find({
      action: { $in: ["match_create", "match_join", "tile_capture", "signup"] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name")
      .lean();

    res.json({
      activity: logs.map((l) => ({
        id: String(l._id),
        action: l.action,
        meta: l.meta || {},
        user: l.userId ? { id: String(l.userId._id), name: l.userId.name } : null,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { listMyActivity, listGlobalFeed };
