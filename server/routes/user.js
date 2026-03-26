const express = require('express');
const router = express.Router();
const User = require('../models/User');

console.log("User Route file is loading...");

// ==========================================
// 1. ADMIN ROUTES (New)
// ==========================================

// @route   GET /api/users
// @desc    Get All Users (For Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a User (For Admin Dashboard)
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User Deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/create-admin
// @desc    Allow an existing Admin to create a NEW Admin
router.post('/create-admin', async (req, res) => {
  const { name, email, phone } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Force role to be 'admin'
    user = new User({ 
      name, 
      email, 
      phone, 
      role: 'admin',
      firebaseUid: 'manual_creation_' + Date.now() 
    });

    await user.save();
    res.json({ msg: 'New Admin Created Successfully!' });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// ==========================================
// 2. AUTHENTICATION ROUTES (Existing)
// ==========================================

// @route   POST /api/users/register
// @desc    Register a new user in MongoDB
router.post('/register', async (req, res) => {
  // 🟢 FIX: Added name and phone here so they aren't undefined
  const { name, email, phone, firebaseUid } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Admin Check Logic
    const role = (email === "admin@gmail.com") ? "admin" : "user";

    user = new User({
      name,
      phone,
      email,
      firebaseUid,
      role
    });

    await user.save();
    res.status(201).json({ msg: 'User registered successfully', user });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/google-login
// @desc    Login or Register a Google User
router.post('/google-login', async (req, res) => {
  const { email, firebaseUid, name } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.json({ user });
    }

    // New Google User
    const role = (email === "admin@gmail.com") ? "admin" : "user";

    user = new User({
      name: name || "Google User",
      email,
      firebaseUid,
      role,
      phone: ""
    });

    await user.save();
    res.json({ user });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/find-by-phone
// @desc    Find user email using phone number
router.post('/find-by-phone', async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ msg: 'No account found with this phone number' });
    }
    res.json({ email: user.email });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;