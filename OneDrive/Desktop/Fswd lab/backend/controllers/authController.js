const User = require("../models/User");
const Profile = require("../models/Profile");
const bcrypt = require("bcryptjs");

// Register User
const register = async (req, res) => {
  try {
    const { fullName, email, username, password, confirmPassword } = req.body;

    if (!fullName || !email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ message: "Username is already taken." });
      }
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      role: "user",
      isActive: true,
      activeTemplate: "modern"
    });

    // Initialize Profile
    await Profile.create({
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      headline: "Full-Stack Developer",
      bio: "Welcome to my portfolio! Edit your profile to update details."
    });

    // Set Express Session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    return res.status(201).json({
      message: "Registration successful!",
      user: req.session.user
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { login: identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please enter email/username and password." });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: cleanIdentifier }, { email: cleanIdentifier }]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email/username or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated by the admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email/username or password." });
    }

    // Set Express Session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    return res.status(200).json({
      message: "Login successful!",
      user: req.session.user
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
};

// Logout User
const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to log out." });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully." });
  });
};

// Get Current User (Session Check)
const getMe = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(200).json({ user: null });
    }

    const user = await User.findById(req.session.user.id).select("-password");
    if (!user || !user.isActive) {
      req.session.destroy();
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching user profile." });
  }
};

// Forgot Password (Direct Password Reset for Demo/Educational Purpose)
const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully! You can now log in." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Server error during password reset." });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
};