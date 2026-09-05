const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    condition: {
      type: String,
      enum: [
        "New",
        "Like New",
        "Good",
        "Fair",
        "Used"
      ],
      required: true
    },

    location: {
      type: String,
      required: true
    },

    images: [
      {
        type: String
      }
    ],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);