const { Match, generateCode, nextColor, MAX_PLAYERS } = require("../models/matchModel");
const { ActivityLog } = require("../models/activityLogModel");
const { findById } = require("../models/userModel");

function publicMatch(match) {
  if (!match) return null;
  const m = typeof match.toJSON === "function" ? match.toJSON() : match;
  return {
    id: m.id,
    code: m.code,
    hostId: String(m.hostId),
    status: m.status,
    gridSize: m.gridSize,
    captures: m.captures,
    players: m.players.map((p) => ({
      userId: String(p.userId),
      name: p.name,
      color: p.color,
      online: p.online,
      tiles: p.tiles,
    })),
    grid: m.grid.map((t) => ({
      ownerId: t.ownerId ? String(t.ownerId) : null,
      color: t.color,
    })),
    createdAt: m.createdAt,
    endedAt: m.endedAt,
  };
}

async function createMatch(req, res, next) {
  try {
    const user = await findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = generateCode();
      const exists = await Match.exists({ code });
      if (!exists) break;
      attempts++;
    }
    if (attempts >= 10) {
      return res.status(500).json({ error: "Could not generate unique match code" });
    }

    // Honor user's preferred color if available, else pick next available
    const color = user.preferredColor
      ? nextColor([], user.preferredColor)
      : nextColor([]);
    const match = await Match.create({
      code,
      hostId: req.user.id,
      players: [
        {
          userId: req.user.id,
          name: user.name,
          color,
          online: true,
          tiles: 0,
        },
      ],
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "match_create",
      meta: { matchCode: code, matchId: String(match._id) },
    });

    res.status(201).json({ match: publicMatch(match) });
  } catch (e) {
    next(e);
  }
}

async function joinMatch(req, res, next) {
  try {
    const code = String(req.params.code || "").toUpperCase();
    if (code.length !== 6) return res.status(400).json({ error: "Invalid code" });

    const user = await findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const match = await Match.findOne({ code });
    if (!match) return res.status(404).json({ error: "Match not found" });
    if (match.status === "ended") return res.status(410).json({ error: "Match ended" });

    const existing = match.players.find((p) => String(p.userId) === req.user.id);
    if (existing) {
      existing.online = true;
      await match.save();
      return res.json({ match: publicMatch(match), rejoined: true });
    }

    if (match.players.length >= MAX_PLAYERS) {
      return res.status(409).json({ error: "Match is full" });
    }

    const usedColors = match.players.map((p) => p.color);
    // Use preferred color if available and not taken
    const color = user.preferredColor
      ? nextColor(usedColors, user.preferredColor)
      : nextColor(usedColors);

    match.players.push({
      userId: req.user.id,
      name: user.name,
      color,
      online: true,
      tiles: 0,
    });
    if (match.status === "lobby") match.status = "active";
    await match.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "match_join",
      meta: { matchCode: code, matchId: String(match._id) },
    });

    res.json({ match: publicMatch(match), rejoined: false });
  } catch (e) {
    next(e);
  }
}

async function getMatch(req, res, next) {
  try {
    const code = String(req.params.code || "").toUpperCase();
    const match = await Match.findOne({ code });
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json({ match: publicMatch(match) });
  } catch (e) {
    next(e);
  }
}

async function leaveMatch(req, res, next) {
  try {
    const code = String(req.params.code || "").toUpperCase();
    const match = await Match.findOne({ code });
    if (!match) return res.status(404).json({ error: "Match not found" });

    const p = match.players.find((p) => String(p.userId) === req.user.id);
    if (p) p.online = false;
    await match.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "match_leave",
      meta: { matchCode: code },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function listMyMatches(req, res, next) {
  try {
    const matches = await Match.find({ "players.userId": req.user.id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    res.json({
      matches: matches.map((m) => ({
        id: String(m._id),
        code: m.code,
        status: m.status,
        playerCount: m.players.length,
        captures: m.captures,
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { createMatch, joinMatch, getMatch, leaveMatch, listMyMatches, publicMatch };
