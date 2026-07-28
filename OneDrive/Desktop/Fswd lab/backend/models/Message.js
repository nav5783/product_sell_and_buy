const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  recipientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  subject: { type: String, default: "" },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
