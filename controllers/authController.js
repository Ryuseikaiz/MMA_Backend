const User = require("../models/User");
const Token = require("../models/Token");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

exports.register = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user = new User({ fullName, email, password: hashedPassword });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationCode = await bcrypt.hash(verificationCode, 10);
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const htmlMessage = `<h1>Email Verification</h1>
                             <p>Your verification code is:</p>
                             <h2 style="text-align:center;letter-spacing:3px;">${verificationCode}</h2>
                             <p>This code is valid for 10 minutes.</p>`;

    await sendEmail(user.email, "Your Verification Code", htmlMessage);

    res.status(201).json({
      msg: "Registration successful. Please check your email for the verification code.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ msg: "Email and code are required." });
    }

    const user = await User.findOne({
      email,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired code." });
    }

    const isMatch = await bcrypt.compare(code, user.verificationCode);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid code." });
    }

    user.status = "verified";
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ msg: "Account verified successfully. You can now log in." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(400).json({ msg: "Invalid Credentials" });

    if (user.status === "unverified") {
      return res.status(403).json({
        msg: "Please verify your email before logging in.",
        errorCode: "ACCOUNT_NOT_VERIFIED",
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const payload = { user: { id: user.id } };
    const appToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });
    res.json({
      token: appToken,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
};
