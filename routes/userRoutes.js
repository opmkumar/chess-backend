const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/verify-otp", authController.verifyOtp);
router.get("/:id", userController.getUser);

//protect all routes after this middleware
router.use(authController.protect);
router.get("/me", userController.getMe, userController.getUser);

router.route("/").get(userController.getAllUsers).post(userController.addUser);
router
  .route("/:id")
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
