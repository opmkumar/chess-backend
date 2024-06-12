const express = require("express");
const router = express.Router();
const gameController = require("./../controllers/gameController");

router.get("/completedGames/:id", gameController.getUserCompletedGames);

module.exports = router;
