const express = require("express");
const path = require("path");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const userRouter = require("./routes/userRoutes");
const gameRouter = require("./routes/gameRoutes");

const app = express();

// app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", // Adjust based on your frontend domain
    credentials: true,
  })
);

app.use(
  session({
    secret: "mera lund jiye ye zindagi",
    resave: true,
    saveUninitialized: true,
  })
);
//body parser, reading data from body into req.body
app.use(express.json());

const { ExpressPeerServer } = require("peer");
const { createServer } = require("http");
const server = createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use("/peerjs", peerServer);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/games", gameRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Cant find the url ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
