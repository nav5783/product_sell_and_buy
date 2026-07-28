const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  technology: { type: String, default: "" }, // CSV or tags string
  image: { type: String, default: "" },
  githubLink: { type: String, default: "" },
  liveDemo: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", projectSchema);
