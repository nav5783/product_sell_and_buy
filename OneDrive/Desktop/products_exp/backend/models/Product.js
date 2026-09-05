const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    condition: {
      type: String,
      required: [true, 'Product condition is required'],
      enum: ['New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    location: {
      type: String,
      required: [true, 'Product location is required'],
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'out_of_stock', 'sold'],
      default: 'available',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Product', productSchema);
