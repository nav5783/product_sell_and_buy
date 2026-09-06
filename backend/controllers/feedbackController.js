const Feedback = require('../models/Feedback');
const Product = require('../models/Product');

// @desc    Submit new feedback review
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res, next) => {
  try {
    const { productId, rating, experienceCategory, comment, recommended } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      product: productId || null,
      rating: Number(rating),
      experienceCategory: experienceCategory || 'App Experience',
      comment,
      recommended: recommended !== undefined ? Boolean(recommended) : true,
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('user', 'name avatar')
      .populate('product', 'title price');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback for a specific product or general app
// @route   GET /api/feedback
// @access  Public
const getFeedbacks = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const query = {};
    if (productId) {
      query.product = productId;
    }

    const feedbacks = await Feedback.find(query)
      .populate('user', 'name avatar')
      .populate('product', 'title price')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(feedbacks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFeedback,
  getFeedbacks,
};
