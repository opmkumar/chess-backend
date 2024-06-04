const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { createServer } = require("http");
dotenv.config({ path: "./config.env" });
const app = require("./app");
const port = process.env.PORT;
const server = createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("./utils/appError");
const User = require("./models/userModel");
const Game = require("./models/gameModel");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Uncaught exception! Closing the system");
  process.exit(1);
});

io.use(async function (socket, next) {
  try {
    if (socket.handshake.query && socket.handshake.query.jwt) {
      const decoded = await promisify(jwt.verify)(
        socket.handshake.query.jwt,
        process.env.JWT_SECRET
      );
      socket.user = await User.findById(decoded.id);
      if (!socket.user) {
        return next(
          new AppError("the user belonging to this token doesnt exists", 401)
        );
      }
      // console.log(socket.user);
      next();
    } else {
      next(new AppError("Authentication error...", 401));
    }
  } catch (error) {
    next(new AppError("Something went wrong in authentication...", 401));
  }
});
io.on("connection", async (socket) => {
  console.log("a user connected");

  if (socket.user) {
    try {
      socket.user.socketId = socket.id;
      socket.user.online = true;
      await socket.user.save({
        validateBeforeSave: false,
      });
      const onlineUsers = await User.find({ online: true });

      // console.log("all good");
      socket.broadcast.emit("updateOnlineList", onlineUsers);
      socket.emit("updateOnlineList", onlineUsers);
    } catch (error) {
      console.log(error);
    }
  }

  console.log(socket.user);

  socket.on("sendInvite", async (invitedToId) => {
    try {
      const invited = await User.findById(invitedToId);
      const inviter = socket.user;
      // console.log(invited, "invited to");

      socket.to(invited.socketId).emit("receiveInvite", inviter);
    } catch (error) {
      console.log("error in sendInvite:", error);
    }
  });

  socket.on("challengeAccepted", async (inviterId) => {
    try {
      const inviter = await User.findById(inviterId);
      const invited = socket.user;

      const whiteProb = Math.random();
      let playerWhite = whiteProb > 0.5 ? inviter : invited;
      let playerBlack = whiteProb < 0.5 ? inviter : invited;
      let inviterColor = whiteProb > 0.5 ? "white" : "black";
      let invitedColor = whiteProb < 0.5 ? "white" : "black";
      const game = await Game.create({
        playerBlack,
        playerWhite,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        status: "pending",
      });

      socket.join(game._id);
      socket
        .to(inviter.socketId)
        .emit("challengeAccepted", { color: inviterColor, gameId: game._id });
      socket.emit("challengeAccepted", {
        color: invitedColor,
        gameId: game._id,
      });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("joinGame", function (gameId) {
    socket.join(gameId);
  });

  socket.on("movePiece", async (move) => {
    try {
      const game = await Game.findById(move.gameId);
      if (game) {
        game.fen = move.fen;
        await game.save();
        io.to(move.gameId).emit("updateBoard", move.fen);
      }
    } catch (error) {
      console.log("error in movePiece:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("user disconnected");

    socket.user.online = false;
    await socket.user.save({
      validateBeforeSave: false,
    });
    // console.log(socket.user);

    const onlineUsers = await User.find({ online: true });
    io.emit("updateOnlineList", onlineUsers);
    io.emit("removeChallenge", socket.user._id);
  });
});

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log("connected successfully");
});

server.listen(port, () => {
  console.log(`app listening on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection! Closing the system");
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
