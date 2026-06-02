// models/Product.js

const mongoose = require("mongoose");

// Review sub-schema
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Snapshot of user's name at review time
    name: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Main product schema
const productSchema = new mongoose.Schema(
  {
    // Admin who created the product
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },

    brand: {
      type: String,
      default: "Generic",
      trim: true,
    },

    image: {
      type: String,

      // Product image URL
      default: "https://via.placeholder.com/400x400",
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      default: 0,
      min: [0, "Product stock cannot be negative"],
    },

    // Embedded review documents
    reviews: [reviewSchema],

    // Review statistics
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for product search
productSchema.index({
  name: "text",
  description: "text",
  category: "text",
});

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

module.exports = Product;