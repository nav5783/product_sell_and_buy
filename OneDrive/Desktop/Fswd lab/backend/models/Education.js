const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  college: { type: String, required: true },
  degree: { type: String, required: true },
  department: { type: String, default: "" },
  cgpa: { type: String, default: "" },
  startYear: { type: String, default: "" },
  endYear: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Education", educationSchema);
