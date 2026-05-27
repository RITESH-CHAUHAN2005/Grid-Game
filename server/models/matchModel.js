const { Schema, model } = require("mongoose");

const GRID_SIZE = 20;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const MAX_PLAYERS = 8;

const PLAYER_COLORS = [
  "#a855f7",
  "#22d3ee",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
];

const playerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    color: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    online: { type: Boolean, default: true },
    tiles: { type: Number, default: 0 },
  },
  { _id: false },
);

const tileSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    color: { type: String, default: null },
    capturedAt: { type: Date, default: null },
  },
  { _id: false },
);

const matchSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
    },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["lobby", "active", "ended"],
      default: "lobby",
      index: true,
    },
    players: {
      type: [playerSchema],
      default: [],
      validate: (v) => v.length <= MAX_PLAYERS,
    },
    grid: {
      type: [tileSchema],
      default: () => Array.from({ length: TOTAL_TILES }, () => ({ ownerId: null, color: null })),
    },
    gridSize: { type: Number, default: GRID_SIZE },
    endedAt: { type: Date, default: null },
    captures: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

matchSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function nextColor(usedColors, preferredColor) {
  // If preferred color is available, use it
  if (preferredColor && !usedColors.includes(preferredColor)) {
    return preferredColor;
  }
  for (const c of PLAYER_COLORS) {
    if (!usedColors.includes(c)) return c;
  }
  return PLAYER_COLORS[usedColors.length % PLAYER_COLORS.length];
}

const Match = model("Match", matchSchema);

module.exports = {
  Match,
  generateCode,
  nextColor,
  PLAYER_COLORS,
  GRID_SIZE,
  TOTAL_TILES,
  MAX_PLAYERS,
};
