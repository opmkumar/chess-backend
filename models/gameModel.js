const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  playerWhite: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  playerBlack: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  fen: { type: String },
  status: { type: String, default: "pending" },
  whiteTime: {
    type: Number,
    default: 300000,
  },
  blackTime: {
    type: Number,
    default: 300000,
  },
  lastMoveTime: {
    type: Number,
    default: () => Date.now(),
  },
  winner: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
});

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
