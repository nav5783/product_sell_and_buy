const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  activeTemplate: {
    type: String,
    default: "modern",
  },
  themePrimary: {
    type: String,
    default: "#6366f1",
  },
  themeBg: {
    type: String,
    default: "#090d16",
  },
  themeCardBg: {
    type: String,
    default: "#111827",
  },
  themeText: {
    type: String,
    default: "#f8fafc",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);