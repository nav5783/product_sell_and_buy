const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
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
} = require("../controllers/userController");

// All user routes require authentication
router.use(isAuthenticated);

// Dashboard Overview
router.get("/dashboard", getDashboardOverview);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/profile/upload", upload.single("file"), uploadProfileAsset);

// Projects
router.get("/projects", getProjects);
router.post("/projects", upload.single("image"), createProject);
router.put("/projects/:id", upload.single("image"), updateProject);
router.delete("/projects/:id", deleteProject);

// Skills
router.get("/skills", getSkills);
router.post("/skills", createSkill);
router.put("/skills/:id", updateSkill);
router.delete("/skills/:id", deleteSkill);

// Experience
router.get("/experience", getExperience);
router.post("/experience", createExperience);
router.put("/experience/:id", updateExperience);
router.delete("/experience/:id", deleteExperience);

// Education
router.get("/education", getEducation);
router.post("/education", createEducation);
router.put("/education/:id", updateEducation);
router.delete("/education/:id", deleteEducation);

// Achievements
router.get("/achievements", getAchievements);
router.post("/achievements", upload.single("certificateImage"), createAchievement);
router.put("/achievements/:id", upload.single("certificateImage"), updateAchievement);
router.delete("/achievements/:id", deleteAchievement);

// Theme
router.get("/templates", getAvailableTemplates);
router.put("/theme", updateActiveTemplate);

// Messages
router.get("/messages", getUserMessages);
router.put("/messages/:id/read", markMessageRead);

// Settings
router.put("/settings/change-password", changePassword);

module.exports = router;
