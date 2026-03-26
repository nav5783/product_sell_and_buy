const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const sendBookingEmail = require('../utils/emailService'); // Make sure utils/emailService.js exists!

// 1. CREATE BOOKING (User)
router.post('/', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();

    // Send Email
    await sendBookingEmail(newBooking.userEmail, newBooking);

    res.json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 2. GET ALL BOOKINGS (Admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 3. CANCEL BOOKING (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ msg: "Booking Cancelled" });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;