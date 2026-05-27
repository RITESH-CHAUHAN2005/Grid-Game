const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const { Match } = require("../models/matchModel");
const { ActivityLog } = require("../models/activityLogModel");
const { publicMatch } = require("../controllers/matchController");

function roomName(code) {
  return `match:${code}`;
}

// Per-match short-circuit cache: avoids hammering Mongo for the same hot match doc.
// Each entry: { match, expiresAt }
// We only cache the lightweight publicMatch payload for emit reuse, not the full doc.
// (Real source of truth stays Mongo; cache only narrows reads inside a 750ms window.)
const matchCache = new Map();
const MATCH_CACHE_TTL_MS = 750;

function cacheGet(code) {
  const e = matchCache.get(code);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    matchCache.delete(code);
    return null;
  }
  return e.match;
}
function cachePut(code, match) {
  matchCache.set(code, { match, expiresAt: Date.now() + MATCH_CACHE_TTL_MS });
}
function cacheBust(code) {
  matchCache.delete(code);
}

async function loadMatch(code, { fresh = false } = {}) {
  if (!fresh) {
    const c = cacheGet(code);
    if (c) return c;
  }
  const m = await Match.findOne({ code }).lean();
  if (m) cachePut(code, m);
  return m;
}

function attachSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Missing token"));
      const payload = verifyToken(token);
      socket.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("match:join", async ({ code }, cb) => {
      try {
        const c = String(code || "").toUpperCase();
        if (c.length !== 6) return cb?.({ error: "Invalid code" });

        const updated = await Match.findOneAndUpdate(
          { code: c, "players.userId": socket.user.id },
          { $set: { "players.$.online": true } },
          { new: true },
        );
        if (!updated) {
          // Either match missing or user not yet a player
          const exists = await Match.exists({ code: c });
          if (!exists) return cb?.({ error: "Match not found" });
          return cb?.({ error: "Not part of this match (join via REST first)" });
        }

        cacheBust(c);

        socket.join(roomName(c));
        socket.data.matchCode = c;

        const p = updated.players.find((p) => String(p.userId) === socket.user.id);
        socket.to(roomName(c)).emit("player:online", {
          userId: socket.user.id,
          name: p?.name,
        });

        cb?.({ ok: true, match: publicMatch(updated) });
      } catch (e) {
        cb?.({ error: e.message });
      }
    });

    socket.on("tile:capture", async ({ code, idx }, cb) => {
      try {
        const c = String(code || "").toUpperCase();
        const tileIdx = parseInt(idx, 10);
        if (!Number.isInteger(tileIdx) || tileIdx < 0) {
          return cb?.({ error: "Invalid tile index" });
        }

        // Light projection read — only the one tile we care about + players + status
        const match = await Match.findOne(
          { code: c },
          {
            status: 1,
            gridSize: 1,
            captures: 1,
            grid: { $slice: [tileIdx, 1] },
            players: 1,
          },
        ).lean();

        if (!match) return cb?.({ error: "Match not found" });
        if (match.status === "ended") return cb?.({ error: "Match ended" });
        if (!Array.isArray(match.grid) || match.grid.length === 0) {
          return cb?.({ error: "Tile out of bounds" });
        }

        const player = match.players.find((p) => String(p.userId) === socket.user.id);
        if (!player) return cb?.({ error: "You are not in this match" });

        const tile = match.grid[0]; // $slice returned exactly the requested tile
        const prevOwnerId = tile?.ownerId ? String(tile.ownerId) : null;

        if (prevOwnerId === socket.user.id) {
          return cb?.({ ok: true, noop: true });
        }

        // Atomic targeted update: set this single tile, bump captures, status active
        const setOps = {
          [`grid.${tileIdx}.ownerId`]: socket.user.id,
          [`grid.${tileIdx}.color`]: player.color,
          [`grid.${tileIdx}.capturedAt`]: new Date(),
        };
        if (match.status === "lobby") setOps.status = "active";

        // arrayFilters lets us $inc tiles for capturer and (if any) decrement previous owner
        const arrayFilters = [{ "capturer.userId": player.userId }];
        const incOps = {
          captures: 1,
          "players.$[capturer].tiles": 1,
        };
        if (prevOwnerId) {
          arrayFilters.push({ "victim.userId": tile.ownerId });
          incOps["players.$[victim].tiles"] = -1;
        }

        const updated = await Match.findOneAndUpdate(
          { code: c, status: { $ne: "ended" } },
          { $set: setOps, $inc: incOps },
          { new: true, arrayFilters, projection: { players: 1, captures: 1, status: 1 } },
        ).lean();

        if (!updated) return cb?.({ error: "Match no longer active" });

        cacheBust(c);

        // Build broadcast payload from the updated doc (no extra read needed)
        const updatedPlayer = updated.players.find((p) => String(p.userId) === socket.user.id);
        const payload = {
          idx: tileIdx,
          ownerId: socket.user.id,
          ownerName: updatedPlayer?.name || player.name,
          color: player.color,
          stoleFrom: prevOwnerId,
          tileCounts: updated.players.map((p) => ({
            userId: String(p.userId),
            tiles: Math.max(0, p.tiles | 0),
          })),
        };

        io.to(roomName(c)).emit("tile:updated", payload);
        cb?.({ ok: true });

        // Log activity off the hot path
        ActivityLog.create({
          userId: socket.user.id,
          action: "tile_capture",
          meta: { matchCode: c, tileIdx, stoleFrom: prevOwnerId },
        }).catch(() => {});
      } catch (e) {
        cb?.({ error: e.message });
      }
    });

    socket.on("match:leave", async ({ code }) => {
      try {
        const c = String(code || "").toUpperCase();
        await Match.updateOne(
          { code: c, "players.userId": socket.user.id },
          { $set: { "players.$.online": false } },
        );
        cacheBust(c);
        socket.leave(roomName(c));
        io.to(roomName(c)).emit("player:offline", { userId: socket.user.id });
      } catch {}
    });

    socket.on("disconnect", async () => {
      const c = socket.data.matchCode;
      if (!c) return;
      try {
        await Match.updateOne(
          { code: c, "players.userId": socket.user.id },
          { $set: { "players.$.online": false } },
        );
        cacheBust(c);
        io.to(roomName(c)).emit("player:offline", { userId: socket.user.id });
      } catch {}
    });
  });

  return io;
}

module.exports = { attachSocket };
