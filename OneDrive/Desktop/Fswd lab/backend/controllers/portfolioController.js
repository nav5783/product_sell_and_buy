const User = require("../models/User");
const Profile = require("../models/Profile");
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Experience = require("../models/Experience");
const Education = require("../models/Education");
const Achievement = require("../models/Achievement");
const Message = require("../models/Message");
const Template = require("../models/Template");

// GET Public Portfolio Data by Username
const getPublicPortfolio = async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim().toLowerCase();

    const user = await User.findOne({ username: cleanUsername }).select("-password");

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "Portfolio user not found or inactive." });
    }

    const userId = user._id;

    const [profile, projects, skills, experience, education, achievements] = await Promise.all([
      Profile.findOne({ userId }),
      Project.find({ userId }).sort({ createdAt: -1 }),
      Skill.find({ userId }).sort({ percentage: -1 }),
      Experience.find({ userId }).sort({ createdAt: -1 }),
      Education.find({ userId }).sort({ startYear: -1 }),
      Achievement.find({ userId }).sort({ createdAt: -1 }),
    ]);

    // Active Template Theme Lookup
    let themeKey = user.activeTemplate || "modern";
    const dbTemplate = await Template.findOne({ themeKey });

    const themePrimary = user.themePrimary || dbTemplate?.primaryColor || "#6366f1";
    const themeBg = user.themeBg || dbTemplate?.bgColor || "#090d16";
    const themeCardBg = user.themeCardBg || dbTemplate?.cardBg || "#111827";
    const themeText = user.themeText || dbTemplate?.textColor || "#f8fafc";
    const bgImage = dbTemplate?.bgImage || "";

    return res.status(200).json({
      user: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        activeTemplate: themeKey,
        themePrimary,
        themeBg,
        themeCardBg,
        themeText,
        bgImage
      },
      profile: profile || {},
      projects: projects || [],
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      achievements: achievements || [],
      themeKey
    });
  } catch (error) {
    console.error("Get Public Portfolio error:", error);
    return res.status(500).json({ message: "Error loading portfolio." });
  }
};

// POST Contact Message from Visitor to Portfolio Owner
const sendContactMessage = async (req, res) => {
  try {
    const { username } = req.params;
    const { senderName, senderEmail, subject, message } = req.body;

    if (!senderName || !senderEmail || !message) {
      return res.status(400).json({ message: "Please fill in Name, Email, and Message." });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    const newMessage = await Message.create({
      recipientUserId: user._id,
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim().toLowerCase(),
      subject: subject ? subject.trim() : "Portfolio Contact",
      message: message.trim(),
      isRead: false
    });

    return res.status(201).json({ message: "Message sent successfully!", newMessage });
  } catch (error) {
    console.error("Send Contact Message error:", error);
    return res.status(500).json({ message: "Error sending message." });
  }
};

module.exports = {
  getPublicPortfolio,
  sendContactMessage,
};
