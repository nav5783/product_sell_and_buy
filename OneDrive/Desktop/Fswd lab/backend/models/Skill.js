const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  skillName: { type: String, required: true },
  category: { type: String, default: "Frontend" }, // e.g. Frontend, Backend, Database, Tools
  percentage: { type: Number, default: 80, min: 0, max: 100 },
  icon: { type: String, default: "code" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Skill", skillSchema);
