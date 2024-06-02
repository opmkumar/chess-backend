const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const session = require("express-session");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, req) => {
  const token = signToken(user._id);

  // const cookieOptions = {
  //   expire: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true,
  //   secure: false,
  //   sameSite: "Lax", // Ensures cookie is sent with cross-site requests
  // };
  // // // if (process.env.NODE_ENV === "production") {
  // // //   cookieOptions.secure = true;
  // // // }
  // res.cookie("jwt", token, cookieOptions);

  req.session.jwt = token;
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const generateOtp = (length = 4) => {
  let val = Math.floor(1000 + Math.random() * 9000);
  return val;
};

exports.signup = catchAsync(async (req, res, next) => {
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    otp,
    otpExpiry,
  });

  //send mail to the user's email
  const message = `Your OTP is ${otp}`;
  await sendEmail({
    to: newUser.email,
    subject: "WELCOME TO THE biCHESS",
    message,
  });

  // res.cookie("username", "JohnDoe", { maxAge: 900000, httpOnly: true });
  createSendToken(newUser, 201, res, req);
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // if (req.session.jwt) {
  //   token = req.session.jwt;
  // }

  // console.log(token);

  if (!token) {
    return next(
      new AppError("you are not logged in! Please login to get access", 401)
    );
  }

  //2)verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError("the user belonging to this token doesnt exists", 401)
    );
  }
  // console.log(user);
  const { otp } = req.body;
  // console.log(typeof otp);

  const email = user.email;

  if (user.otp === otp && Date.now() < user.otpExpiry) {
    // console.log("valid otp");
    user.isActive = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save({
      validateBeforeSave: false,
    });
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } else {
    console.log("invalid otp");
    res.status(404).json({
      status: "error",
      message: "Invalid otp or otp expired.",
    });
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  //check if email and password are provided
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }

  //verify the email and password
  const user = await User.findOne({ email }).select("+password");

  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  user.otp = otp;
  user.otpExpiry = otpExpiry;

  await user.save({
    validateBeforeSave: false,
  });
  //send mail to the user's email
  const message = `Your OTP is ${otp}`;
  await sendEmail({
    to: user.email,
    subject: "WELCOME TO THE biCHESS",
    message,
  });
  //if everything good send token to the cleint
  createSendToken(user, 200, res, req);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1)getting token and checking if it exists or not
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token);

  if (!token) {
    return next(
      new AppError("you are not logged in! Please login to get access", 401)
    );
  }

  //2)verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3) Check if user still exists

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("the user belonging to this token no longer exists", 401)
    );
  }

  //4) Check if user changed the password after the token was issued

  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "user recently changed the password! Please login again...",
        401
      )
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
