const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handleFactory");

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)check if user is attempting to change its password in this route.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "You cannot update your password in this route.Please go to /updateMyPassword route",
        400
      )
    );
  }
  //2)Filter out unwanted fieldnames which are not allowed to be updated
  const filterBody = filterObj(req.body, "name", "email");
  //2)update the user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false }, { new: true });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.addUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "this route is not yet defined.Please use /signup instead",
  });
};

exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
//do not attempt to change password here
exports.updateUser = factory.updateOne(User);
