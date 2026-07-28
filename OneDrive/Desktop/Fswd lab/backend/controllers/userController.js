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

// GET User Dashboard Data
const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId).select("-password");
    const profile = await Profile.findOne({ userId });

    const projectsCount = await Project.countDocuments({ userId });
    const skillsCount = await Skill.countDocuments({ userId });
    const expCount = await Experience.countDocuments({ userId });
    const eduCount = await Education.countDocuments({ userId });
    const achCount = await Achievement.countDocuments({ userId });
    const unreadMessagesCount = await Message.countDocuments({ recipientUserId: userId, isRead: false });

    return res.status(200).json({
      user,
      profile,
      stats: {
        projectsCount,
        skillsCount,
        expCount,
        eduCount,
        achCount,
        unreadMessagesCount
      }
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({ message: "Error fetching dashboard overview." });
  }
};

// GET Profile
const getProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = await Profile.create({ userId });
    }
    const user = await User.findById(userId).select("-password");
    return res.status(200).json({ profile, user });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile." });
  }
};

// UPDATE Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const {
      fullName,
      headline,
      bio,
      aboutMe,
      phone,
      email,
      location,
      website,
      github,
      linkedin,
      geeksforgeeks,
      leetcode,
      hackerrank,
      twitter,
      instagram,
      languages
    } = req.body;

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    if (fullName) {
      profile.fullName = fullName;
      await User.findByIdAndUpdate(userId, { fullName });
    }
    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (aboutMe !== undefined) profile.aboutMe = aboutMe;
    if (phone !== undefined) profile.phone = phone;
    if (email !== undefined) profile.email = email;
    if (location !== undefined) profile.location = location;
    if (website !== undefined) profile.website = website;
    if (github !== undefined) profile.github = github;
    if (linkedin !== undefined) profile.linkedin = linkedin;
    if (geeksforgeeks !== undefined) profile.geeksforgeeks = geeksforgeeks;
    if (leetcode !== undefined) profile.leetcode = leetcode;
    if (hackerrank !== undefined) profile.hackerrank = hackerrank;
    if (twitter !== undefined) profile.twitter = twitter;
    if (instagram !== undefined) profile.instagram = instagram;
    if (languages !== undefined) {
      profile.languages = Array.isArray(languages)
        ? languages
        : typeof languages === "string"
        ? languages.split(",").map((l) => l.trim()).filter(Boolean)
        : [];
    }

    profile.updatedAt = Date.now();
    await profile.save();

    return res.status(200).json({ message: "Profile updated successfully!", profile });
  } catch (error) {
    console.error("Update Profile error:", error);
    return res.status(500).json({ message: "Error updating profile." });
  }
};

// UPLOAD Profile Assets (Photo, Cover, Resume)
const uploadProfileAsset = async (req, res) => {
  try {
    const userId = req.session.user.id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fieldName = req.file.fieldname; // profilePhoto | coverImage | resumeUrl

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    if (fieldName === "profilePhoto") {
      profile.profilePhoto = fileUrl;
    } else if (fieldName === "coverImage") {
      profile.coverImage = fileUrl;
    } else if (fieldName === "resumeUrl") {
      profile.resumeUrl = fileUrl;
    } else {
      profile[fieldName] = fileUrl;
    }

    await profile.save();

    return res.status(200).json({
      message: `${fieldName} uploaded successfully!`,
      fileUrl,
      profile
    });
  } catch (error) {
    console.error("Upload Asset error:", error);
    return res.status(500).json({ message: "File upload failed." });
  }
};

// --- PROJECTS CRUD ---
const getProjects = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching projects." });
  }
};

const createProject = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { title, description, technology, githubLink, liveDemo } = req.body;
    let image = req.file ? `/uploads/${req.file.filename}` : req.body.image || "";

    const project = await Project.create({
      userId,
      title,
      description,
      technology,
      image,
      githubLink,
      liveDemo
    });

    return res.status(201).json({ message: "Project created successfully!", project });
  } catch (error) {
    return res.status(500).json({ message: "Error creating project." });
  }
};

const updateProject = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { title, description, technology, githubLink, liveDemo } = req.body;
    let updateData = { title, description, technology, githubLink, liveDemo };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      updateData.image = req.body.image;
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { returnDocument: 'after' }
    );

    if (!project) return res.status(404).json({ message: "Project not found." });

    return res.status(200).json({ message: "Project updated successfully!", project });
  } catch (error) {
    return res.status(500).json({ message: "Error updating project." });
  }
};

const deleteProject = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    await Project.findOneAndDelete({ _id: id, userId });
    return res.status(200).json({ message: "Project deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting project." });
  }
};

// --- SKILLS CRUD ---
const getSkills = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const skills = await Skill.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(skills);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching skills." });
  }
};

const createSkill = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { skillName, category, percentage, icon } = req.body;

    const skill = await Skill.create({
      userId,
      skillName,
      category: category || "Frontend",
      percentage: Number(percentage) || 80,
      icon: icon || "code"
    });

    return res.status(201).json({ message: "Skill added successfully!", skill });
  } catch (error) {
    return res.status(500).json({ message: "Error adding skill." });
  }
};

const updateSkill = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { skillName, category, percentage, icon } = req.body;

    const skill = await Skill.findOneAndUpdate(
      { _id: id, userId },
      { skillName, category, percentage, icon },
      { new: true }
    );

    if (!skill) return res.status(404).json({ message: "Skill not found." });
    return res.status(200).json({ message: "Skill updated successfully!", skill });
  } catch (error) {
    return res.status(500).json({ message: "Error updating skill." });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    await Skill.findOneAndDelete({ _id: id, userId });
    return res.status(200).json({ message: "Skill deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting skill." });
  }
};

// --- EXPERIENCE CRUD ---
const getExperience = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const experiences = await Experience.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(experiences);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching experience." });
  }
};

const createExperience = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { company, role, startDate, endDate, description } = req.body;

    const exp = await Experience.create({
      userId,
      company,
      role,
      startDate,
      endDate,
      description
    });

    return res.status(201).json({ message: "Experience added successfully!", experience: exp });
  } catch (error) {
    return res.status(500).json({ message: "Error adding experience." });
  }
};

const updateExperience = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { company, role, startDate, endDate, description } = req.body;

    const exp = await Experience.findOneAndUpdate(
      { _id: id, userId },
      { company, role, startDate, endDate, description },
      { new: true }
    );

    if (!exp) return res.status(404).json({ message: "Experience not found." });
    return res.status(200).json({ message: "Experience updated successfully!", experience: exp });
  } catch (error) {
    return res.status(500).json({ message: "Error updating experience." });
  }
};

const deleteExperience = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    await Experience.findOneAndDelete({ _id: id, userId });
    return res.status(200).json({ message: "Experience deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting experience." });
  }
};

// --- EDUCATION CRUD ---
const getEducation = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const education = await Education.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(education);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching education." });
  }
};

const createEducation = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { college, degree, department, cgpa, startYear, endYear } = req.body;

    const edu = await Education.create({
      userId,
      college,
      degree,
      department,
      cgpa,
      startYear,
      endYear
    });

    return res.status(201).json({ message: "Education added successfully!", education: edu });
  } catch (error) {
    return res.status(500).json({ message: "Error adding education." });
  }
};

const updateEducation = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { college, degree, department, cgpa, startYear, endYear } = req.body;

    const edu = await Education.findOneAndUpdate(
      { _id: id, userId },
      { college, degree, department, cgpa, startYear, endYear },
      { new: true }
    );

    if (!edu) return res.status(404).json({ message: "Education record not found." });
    return res.status(200).json({ message: "Education updated successfully!", education: edu });
  } catch (error) {
    return res.status(500).json({ message: "Error updating education." });
  }
};

const deleteEducation = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    await Education.findOneAndDelete({ _id: id, userId });
    return res.status(200).json({ message: "Education deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting education." });
  }
};

// --- ACHIEVEMENTS CRUD ---
const getAchievements = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const achievements = await Achievement.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(achievements);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching achievements." });
  }
};

const createAchievement = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { title, description, date } = req.body;
    let certificateImage = req.file ? `/uploads/${req.file.filename}` : req.body.certificateImage || "";

    const ach = await Achievement.create({
      userId,
      title,
      description,
      date,
      certificateImage
    });

    return res.status(201).json({ message: "Achievement added successfully!", achievement: ach });
  } catch (error) {
    return res.status(500).json({ message: "Error adding achievement." });
  }
};

const updateAchievement = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { title, description, date } = req.body;
    let updateData = { title, description, date };

    if (req.file) {
      updateData.certificateImage = `/uploads/${req.file.filename}`;
    } else if (req.body.certificateImage !== undefined) {
      updateData.certificateImage = req.body.certificateImage;
    }

    const ach = await Achievement.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!ach) return res.status(404).json({ message: "Achievement not found." });
    return res.status(200).json({ message: "Achievement updated successfully!", achievement: ach });
  } catch (error) {
    return res.status(500).json({ message: "Error updating achievement." });
  }
};

const deleteAchievement = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    await Achievement.findOneAndDelete({ _id: id, userId });
    return res.status(200).json({ message: "Achievement deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting achievement." });
  }
};

// --- PORTFOLIO THEME SELECTION & COLOR CUSTOMIZATION ---
const updateActiveTemplate = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { activeTemplate, themePrimary, themeBg, themeCardBg, themeText } = req.body;

    const updateFields = {};
    if (activeTemplate) updateFields.activeTemplate = activeTemplate;
    if (themePrimary) updateFields.themePrimary = themePrimary;
    if (themeBg) updateFields.themeBg = themeBg;
    if (themeCardBg) updateFields.themeCardBg = themeCardBg;
    if (themeText) updateFields.themeText = themeText;

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { returnDocument: 'after' }
    ).select("-password");

    return res.status(200).json({
      message: "Portfolio theme & custom colors updated successfully!",
      activeTemplate: user.activeTemplate,
      themePrimary: user.themePrimary,
      themeBg: user.themeBg,
      themeCardBg: user.themeCardBg,
      themeText: user.themeText
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating theme." });
  }
};

// --- USER MESSAGES ---
const getUserMessages = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const messages = await Message.find({ recipientUserId: userId }).sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching messages." });
  }
};

const markMessageRead = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    await Message.findOneAndUpdate({ _id: id, recipientUserId: userId }, { isRead: true });
    return res.status(200).json({ message: "Message marked as read." });
  } catch (error) {
    return res.status(500).json({ message: "Error updating message." });
  }
};

// --- CHANGE PASSWORD IN SETTINGS ---
const changePassword = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill in all password fields." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error changing password." });
  }
};

const getAvailableTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json(templates);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching active templates." });
  }
};

module.exports = {
  getDashboardOverview,
  getProfile,
  updateProfile,
  uploadProfileAsset,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  updateActiveTemplate,
  getAvailableTemplates,
  getUserMessages,
  markMessageRead,
  changePassword,
};
