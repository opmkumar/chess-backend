const express = require("express");
const path = require("path");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const userRouter = require("./routes/userRoutes");

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

app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Cant find the url ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
