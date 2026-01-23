const express = require('express');
const router = express.Router();
const Package = require('../models/Package'); // Use the NEW Model

// 1. GET ALL PACKAGES
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 2. ADD COMPLEX PACKAGE (Admin)
router.post('/', async (req, res) => {
  // We expect a detailed object now
  const { title, description, image, category, duration, costs } = req.body;

  try {
    const newPackage = new Package({
      title,
      description,
      image,
      category,
      duration,
      costs, // Object containing { flight, hotel, food... }
      gstRate: 18 // Default 18% GST
    });

    await newPackage.save();
    res.json(newPackage);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;