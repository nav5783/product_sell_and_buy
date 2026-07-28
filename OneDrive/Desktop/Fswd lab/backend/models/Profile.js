const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  fullName: { type: String, default: "" },
  headline: { type: String, default: "" },
  bio: { type: String, default: "" },
  aboutMe: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  github: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  geeksforgeeks: { type: String, default: "" },
  leetcode: { type: String, default: "" },
  hackerrank: { type: String, default: "" },
  twitter: { type: String, default: "" },
  instagram: { type: String, default: "" },
  profilePhoto: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  resumeUrl: { type: String, default: "" },
  languages: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", profileSchema);
