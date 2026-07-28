const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "Present" },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Experience", experienceSchema);
