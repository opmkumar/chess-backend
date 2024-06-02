const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  // console.log(err.path);
  const message = `Invalid ${err.path}=${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  // console.log(value);
  const message = `Duplicate field value ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // console.log(err);
  const errMessage = err.message.replace("Validation failed: ", "");
  const errorMessage = `Invalid input data. ${errMessage}`;
  return new AppError(errorMessage, 400);
};

const handleJWTError = () => {
  return new AppError("Invalid token! please login again", 401);
};
const handleJWTExpiredError = () => {
  return new AppError("Token expired! please login again", 401);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operational:send message to the cleint
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //programatic error or unknown error
  else {
    //log
    console.error("error", err);
    res.status(500).json({
      status: "error",
      message: "something went very wrong",
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;

  if (process.env.NODE_ENV == "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, name: err.name, message: err.message };
    // console.log(err.name);
    // console.log(err.code);
    // console.log(err.keyValue.name);
    // console.log(error.message);

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError(error);
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError(error);

    sendErrorProd(error, res);
  }
};
