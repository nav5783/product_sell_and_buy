const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  themeKey: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  previewImage: { type: String, default: "" },
  bgImage: { type: String, default: "" },
  bgColor: { type: String, default: "#0f172a" },
  cardBg: { type: String, default: "#1e293b" },
  primaryColor: { type: String, default: "#6366f1" },
  textColor: { type: String, default: "#f8fafc" },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Template", templateSchema);
