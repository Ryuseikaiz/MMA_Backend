const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    status: {
      type: String,
      enum: ["unverified", "verified", "banned"],
      default: "unverified",
    },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
