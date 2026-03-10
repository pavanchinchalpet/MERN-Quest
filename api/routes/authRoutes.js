const express = require("express");
const { body } = require("express-validator");
const { auth } = require("../middleware/auth");
const authController = require("../controllers/supabaseAuthController");

const router = express.Router();

/*
REGISTER
*/

router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3-20 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),

    body("email")
      .isEmail()
      .withMessage("Valid email required"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
  ],
  authController.register
);

/*
LOGIN
*/

router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").exists()
  ],
  authController.login
);

/*
OTP LOGIN
*/

router.post(
  "/request-otp",
  [body("email").isEmail().withMessage("Valid email required")],
  authController.requestOtp
);

router.post(
  "/verify-otp",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
  ],
  authController.verifyOtp
);

/*
CURRENT USER
*/

router.get("/me", auth, authController.getCurrentUser);

/*
LOGOUT
*/

router.post("/logout", authController.logout);

module.exports = router;