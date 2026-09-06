const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    experienceCategory: {
      type: String,
      enum: ['App Experience', 'Product Quality', 'Delivery & Pickup', 'Value for Money', 'Customer Support'],
      default: 'App Experience',
    },
    comment: {
      type: String,
      required: [true, 'Please provide feedback comments'],
      trim: true,
    },
    recommended: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
