// controllers/orderController.js

const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");

// @route   POST /api/orders
// @desc    Place a new order
// @access  Private
const placeOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,

      // ✅ FIXED:
      // Changed "cod" -> "COD"
      // because schema enum uses uppercase values
      paymentMethod = "COD",
    } = req.body;

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country ||
      !shippingAddress.phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a complete shipping address",
      });
    }

    // Fetch user's cart
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    // ✅ ADDED:
    // Prevent placing order if cart is empty
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

  
    const orderItems = [];

    const stockUpdates = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(
        cartItem.product
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product is no longer available`,
        });
      }

      // Validate stock
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} left.`,
        });
      }

      // ✅ FIXED:
      // Changed orderItems.push -> orderItems.push
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: cartItem.quantity,
      });

      // Store stock updates
      stockUpdates.push({
        id: product._id,
        newStock:
          product.stock - cartItem.quantity,
      });
    }

    // ✅ FIXED:
    // Changed orderItems.reduce -> orderItems.reduce
    const itemsPrice = orderItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    const shippingPrice =
      itemsPrice > 999 ? 0 : 99;

    const taxPrice =
      Math.round(itemsPrice * 0.18 * 100) /
      100;

    const totalPrice =
      Math.round(
        (
          itemsPrice +
          shippingPrice +
          taxPrice
        ) * 100
      ) / 100;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems,

      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      status: "pending",
      isPaid: false,
    });

    // Update stock
    await Promise.all(
      stockUpdates.map(({ id, newStock }) =>
        Product.findByIdAndUpdate(id, {
          stock: newStock,
        })
      )
    );

    // Clear cart after successful order
    await Cart.findOneAndDelete({
      user: req.user._id,
    });

    // Populate user details
    const populatedOrder =
      await Order.findById(order._id).populate(
        "user",
        "name email"
      );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders/my
// @desc    Get logged-in user's orders
// @access  Private
const getMyOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .select("-orderItems");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
const getOrderById = async (
  req,
  res,
  next
) => {
  try {
    const order = await Order.findById(
      req.params.id
    )
      .populate("user", "name email")
      .populate(
        "orderItems.product",
        "name image"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Allow only owner or admin
    const isOwner =
      order.user._id.toString() ===
      req.user._id.toString();

    const isAdmin =
      req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorised to view this order",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message:
          "Order not found — invalid ID",
      });
    }

    next(error);
  }
};

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private/Admin
const getAllOrders = async (
  req,
  res,
  next
) => {
  try {
    const page = Math.max(
      1,
      Number(req.query.page) || 1
    );

    const limit = Math.min(
      50,
      Number(req.query.limit) || 20
    );

    const skip = (page - 1) * limit;

    const filterObj = {};

    if (req.query.status) {
      filterObj.status = req.query.status;
    }

    const [orders, total] =
      await Promise.all([
        Order.find(filterObj)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "name email")
          .select("-orderItems"),

        Order.countDocuments(filterObj),
      ]);

    const revenueAgg =
      await Order.aggregate([
        { $match: filterObj },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$totalPrice",
            },
          },
        },
      ]);

    const totalRevenue =
      revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalRevenue:
        Math.round(totalRevenue * 100) / 100,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
const updateOrderStatus = async (
  req,
  res,
  next
) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (
      !status ||
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      ["delivered", "cancelled"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${order.status} order`,
      });
    }

    order.status = status;

    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    if (status === "cancelled") {
      await Promise.all(
        order.orderItems.map((item) =>
          Product.findByIdAndUpdate(
            item.product,
            {
              $inc: {
                stock: item.quantity,
              },
            }
          )
        )
      );
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/orders/:id/pay
// @desc    Mark order as paid
// @access  Private
const markOrderPaid = async (
  req,
  res,
  next
) => {
  try {
    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message:
          "Order is already marked as paid",
      });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "processing";

    order.paymentResult = {
      id: req.body.paymentIntentId,
      status:
        req.body.paymentStatus ||
        "succeeded",
      email:
        req.body.payerEmail ||
        req.user.email,
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order marked as paid",
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markOrderPaid,
};