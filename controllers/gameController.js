const Game = require("./../models/gameModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.getUserCompletedGames = catchAsync(async (req, res, next) => {
  const playerId = req.params.id;
  const games = await Game.find({
    $or: [{ playerBlack: playerId }, { playerWhite: playerId }],
    status: { $ne: "pending" },
  });
  res.status(200).json({
    status: "success",
    data: {
      games,
    },
  });
});
