const express = require('express');
const router = express.Router();
const { createFeedback, getFeedbacks } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getFeedbacks);
router.post('/', protect, createFeedback);

module.exports = router;
