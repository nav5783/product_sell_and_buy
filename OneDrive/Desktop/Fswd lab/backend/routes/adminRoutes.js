const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
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
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

// Admin Stats
router.get("/stats", getAdminStats);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.patch("/users/:id/toggle-active", toggleUserActive);
router.delete("/users/:id", deleteUser);

// Template Management (Supports previewImage & bgImage upload)
router.get("/templates", getTemplates);
router.post(
  "/templates",
  upload.fields([
    { name: "previewImage", maxCount: 1 },
    { name: "bgImage", maxCount: 1 }
  ]),
  createTemplate
);
router.put(
  "/templates/:id",
  upload.fields([
    { name: "previewImage", maxCount: 1 },
    { name: "bgImage", maxCount: 1 }
  ]),
  updateTemplate
);
router.delete("/templates/:id", deleteTemplate);

// System Messages
router.get("/messages", getAllMessages);
router.delete("/messages/:id", deleteMessage);

module.exports = router;
