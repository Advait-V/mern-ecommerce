// models/Cart.js

const mongoose = require("mongoose");

// Schema for individual cart items
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    // Snapshot price stored at add-to-cart time
    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
  },
  {
    _id: false,
  }
);

// Cart schema
const cartSchema = new mongoose.Schema(
  {
    // One cart per user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Array of cart items
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual field for total cart price
cartSchema.virtual("TotalPrice").get(function () {
  return this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
});

// Include virtuals in JSON responses
cartSchema.set("toJSON", {
  virtuals: true,
});

cartSchema.set("toObject", {
  virtuals: true,
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;