const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  playerWhite: { type: mongoose.Schema.ObjectId, ref: "Tour", required: true },
  playerBlack: { type: mongoose.Schema.ObjectId, ref: "Tour", required: true },
  fen: { type: String },
  status: { type: String },
});

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
