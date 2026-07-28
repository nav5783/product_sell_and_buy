const User = require("../models/User");
const Profile = require("../models/Profile");
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Experience = require("../models/Experience");
const Education = require("../models/Education");
const Achievement = require("../models/Achievement");
const Message = require("../models/Message");
const Template = require("../models/Template");
const bcrypt = require("bcryptjs");

// GET Admin Dashboard Stats
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalProjects = await Project.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalTemplates = await Template.countDocuments();
    const activeTemplates = await Template.countDocuments({ isActive: true });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalAdmins,
        totalProjects,
        totalMessages,
        totalTemplates,
        activeTemplates,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching admin statistics." });
  }
};

// GET All Users (Search & Pagination support)
const getAllUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const count = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return res.status(200).json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalUsers: count,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    return res.status(500).json({ message: "Error fetching users list." });
  }
};

// UPDATE User Details (Admin edit)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, username, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (fullName) user.fullName = fullName.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (username) user.username = username.trim().toLowerCase();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return res.status(200).json({ message: "User updated successfully!", user });
  } catch (error) {
    return res.status(500).json({ message: "Error updating user." });
  }
};

// TOGGLE Activate/Deactivate User
const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully!`,
      user
    });
  } catch (error) {
    return res.status(500).json({ message: "Error toggling user status." });
  }
};

// DELETE User & Cascade User Data
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role === "admin" && user.username === "admin") {
      return res.status(400).json({ message: "Cannot delete primary default admin account." });
    }

    await User.findByIdAndDelete(id);
    await Profile.deleteMany({ userId: id });
    await Project.deleteMany({ userId: id });
    await Skill.deleteMany({ userId: id });
    await Experience.deleteMany({ userId: id });
    await Education.deleteMany({ userId: id });
    await Achievement.deleteMany({ userId: id });
    await Message.deleteMany({ recipientUserId: id });

    return res.status(200).json({ message: "User and all associated data deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting user." });
  }
};

// --- TEMPLATE MANAGEMENT ---
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    return res.status(200).json(templates);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching templates." });
  }
};

const createTemplate = async (req, res) => {
  try {
    const {
      name,
      themeKey,
      description,
      bgColor,
      cardBg,
      primaryColor,
      textColor,
      bgImage,
      isActive,
      isDefault
    } = req.body;

    let previewImage = "";
    let uploadedBgImage = bgImage || "";

    if (req.files && req.files.previewImage) {
      previewImage = `/uploads/${req.files.previewImage[0].filename}`;
    } else if (req.file) {
      previewImage = `/uploads/${req.file.filename}`;
    } else if (req.body.previewImage) {
      previewImage = req.body.previewImage;
    }

    if (req.files && req.files.bgImage) {
      uploadedBgImage = `/uploads/${req.files.bgImage[0].filename}`;
    }

    if (isDefault) {
      await Template.updateMany({}, { isDefault: false });
    }

    const template = await Template.create({
      name,
      themeKey: themeKey.toLowerCase().replace(/\s+/g, "-"),
      description,
      previewImage,
      bgImage: uploadedBgImage,
      bgColor: bgColor || "#0f172a",
      cardBg: cardBg || "#1e293b",
      primaryColor: primaryColor || "#6366f1",
      textColor: textColor || "#f8fafc",
      isActive: isActive !== undefined ? (isActive === true || isActive === "true") : true,
      isDefault: isDefault === true || isDefault === "true"
    });

    return res.status(201).json({ message: "Template created successfully!", template });
  } catch (error) {
    console.error("Create Template error:", error);
    return res.status(500).json({ message: "Error creating template." });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      themeKey,
      description,
      bgColor,
      cardBg,
      primaryColor,
      textColor,
      bgImage,
      isActive,
      isDefault
    } = req.body;

    let updateData = { name, description };

    if (themeKey) updateData.themeKey = themeKey.toLowerCase().replace(/\s+/g, "-");
    if (bgColor !== undefined) updateData.bgColor = bgColor;
    if (cardBg !== undefined) updateData.cardBg = cardBg;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (bgImage !== undefined) updateData.bgImage = bgImage;

    if (isActive !== undefined) updateData.isActive = isActive === true || isActive === "true";
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault === true || isDefault === "true";
      if (updateData.isDefault) {
        await Template.updateMany({ _id: { $ne: id } }, { isDefault: false });
      }
    }

    if (req.files && req.files.previewImage) {
      updateData.previewImage = `/uploads/${req.files.previewImage[0].filename}`;
    } else if (req.file) {
      updateData.previewImage = `/uploads/${req.file.filename}`;
    } else if (req.body.previewImage !== undefined) {
      updateData.previewImage = req.body.previewImage;
    }

    if (req.files && req.files.bgImage) {
      updateData.bgImage = `/uploads/${req.files.bgImage[0].filename}`;
    }

    const template = await Template.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    if (!template) return res.status(404).json({ message: "Template not found." });

    return res.status(200).json({ message: "Template updated successfully!", template });
  } catch (error) {
    console.error("Update Template error:", error);
    return res.status(500).json({ message: "Error updating template." });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await Template.findByIdAndDelete(id);
    return res.status(200).json({ message: "Template deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting template." });
  }
};

// GET All System Messages (Admin view)
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("recipientUserId", "username fullName email")
      .sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching system messages." });
  }
};

// DELETE Message (Admin delete)
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    return res.status(200).json({ message: "Message deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting message." });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUser,
  toggleUserActive,
  deleteUser,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllMessages,
  deleteMessage,
};
