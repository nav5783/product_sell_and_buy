const User = require("../models/User");
const Profile = require("../models/Profile");
const Template = require("../models/Template");
const bcrypt = require("bcryptjs");

const createDefaultAdmin = async () => {
  try {
    // 1. Seed Default Admin Account
    let admin = await User.findOne({
      $or: [{ username: "admin" }, { email: "admin@portfolio.com" }]
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        username: "admin",
        fullName: "System Administrator",
        email: "admin@portfolio.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
        activeTemplate: "modern"
      });
      console.log("Default Admin Account Created: username=admin, password=admin123");
    }

    // Ensure Admin has a profile
    const adminProfile = await Profile.findOne({ userId: admin._id });
    if (!adminProfile) {
      await Profile.create({
        userId: admin._id,
        fullName: admin.fullName,
        headline: "Portfolio System Administrator",
        bio: "Managing users, templates, and portfolios across the system.",
        aboutMe: "Welcome to the Portfolio Management System.",
        email: admin.email
      });
    }

    // 2. Seed Default Templates
    const templatesCount = await Template.countDocuments();
    if (templatesCount === 0) {
      await Template.insertMany([
        {
          name: "Modern Dark",
          themeKey: "modern",
          description: "Sleek dark design with glowing gradients and fluid glassmorphism.",
          isActive: true,
          isDefault: true
        },
        {
          name: "Minimalist Light",
          themeKey: "minimal",
          description: "Clean, elegant typography with crisp white elements and dark borders.",
          isActive: true,
          isDefault: false
        },
        {
          name: "Cyberpunk Neon",
          themeKey: "cyberpunk",
          description: "Vibrant neon accents, dark canvas, futuristic tech layout.",
          isActive: true,
          isDefault: false
        },
        {
          name: "Gradient Wave",
          themeKey: "gradient",
          description: "Colorful fluid dynamic gradients with modern card layouts.",
          isActive: true,
          isDefault: false
        }
      ]);
      console.log("Default Portfolio Templates Seeded");
    }
  } catch (error) {
    console.error("Error creating default admin or templates:", error.message);
  }
};

module.exports = createDefaultAdmin;