const { Schema, model } = require("mongoose");

const gameDataSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    matchCode: {
      type: String,
      default: null,
      trim: true,
      maxlength: 16,
    },
    tiles: {
      type: Number,
      default: 0,
      min: 0,
    },
    wins: {
      type: Number,
      default: 0,
      min: 0,
    },
    matches: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { updatedAt: true, createdAt: false },
    versionKey: false,
  },
);

const GameData = model("GameData", gameDataSchema);

module.exports = { GameData };
