// controllers/cartController.js

const Cart = require("../models/cart");
const Product = require("../models/product");

// Helper function to calculate cart totals
const calcTotals = (cart) => {
  const itemsPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Free shipping above ₹999
  const shippingPrice = itemsPrice > 999 ? 0 : 99;

  // 18% GST
  const taxPrice =
    Math.round(itemsPrice * 0.18 * 100) / 100;

  // Final total
  const totalPrice =
    Math.round(
      (itemsPrice + shippingPrice + taxPrice) * 100
    ) / 100;

  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};

// @route   GET /api/cart
// @desc    Get logged-in user's cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id,
    }).populate(
      "items.product",
      "name image stock price"
    );

    // Remove deleted products from cart
    cart.items = cart.items.filter(
      (item) => item.product
    );
    
    // Save cleaned cart if any deleted items were removed
    await cart.save();

    // Return empty cart if cart does not exist
    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          ...calcTotals({ items: [] }),
        },
      });
    }

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        items: cart.items,
        ...calcTotals(cart),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const {
      productId,
      quantity = 1,
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`,
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    // Check if item already exists in cart
    const existingItemIndex =
      cart.items.findIndex(
        (item) =>
          item.product.toString() ===
          productId.toString()
      );

    if (existingItemIndex > -1) {
      const newQty =
        cart.items[existingItemIndex].quantity +
        Number(quantity);

      // Prevent quantity from exceeding stock
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more — only ${product.stock} units in stock`,
        });
      }

      cart.items[existingItemIndex].quantity =
        newQty;
    } else {
      // Add new item
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: Number(quantity),
      });
    }

    await cart.save();

    // Fetch updated cart with populated product details
    cart = await Cart.findOne({
      user: req.user._id,
    }).populate(
      "items.product",
      "name image stock price"
    );

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart: {
        _id: cart._id,
        items: cart.items,
        ...calcTotals(cart),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/cart/:productId
// @desc    Update cart item quantity
// @access  Private
const updateCartItem = async (
  req,
  res,
  next
) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    // Validate quantity
    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be at least 1. To remove, use DELETE.",
      });
    }

    // Verify product exists
    const product = await Product.findById(
      productId
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock availability
    if (Number(quantity) > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available`,
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity =
      Number(quantity);

    await cart.save();

    const updatedCart = await Cart.findOne({
      user: req.user._id,
    }).populate(
      "items.product",
      "name image stock price"
    );

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: {
        _id: updatedCart._id,
        items: updatedCart.items,
        ...calcTotals(updatedCart),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/cart/:productId
// @desc    Remove item from cart
// @access  Private
const removeCartItem = async (
  req,
  res,
  next
) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Remove matching item
    const originalLength =
      cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !==
        req.params.productId
    );

    // Check if item existed
    if (
      cart.items.length === originalLength
    ) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

    const updatedCart = await Cart.findOne({
      user: req.user._id,
    }).populate(
      "items.product",
      "name image stock price"
    );

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: {
        _id: updatedCart._id,
        items: updatedCart.items,
        ...calcTotals(updatedCart),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart: {
        items: [],
        ...calcTotals({ items: [] }),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};