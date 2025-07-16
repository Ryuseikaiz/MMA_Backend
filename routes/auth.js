const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyCode,
  googleLogin
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-code", verifyCode);
router.post("/google", googleLogin);

module.exports = router;
