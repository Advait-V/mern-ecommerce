// controllers/productController.js

console.log("✅ productController loaded");

const Product = require("../models/product");

// @route   GET /api/products
// @desc    Get all products with search, filters, sorting & pagination
// @access  Public
const getAllProducts = async (req, res, next) => {
  try {
    const queryObj = {};

    // Search by keyword
    if (req.query.keyword) {
      queryObj.$text = {
        $search: req.query.keyword,
      };
    }

    // Filter by category
    if (req.query.category) {
      queryObj.category = {
        $regex: new RegExp(`^${req.query.category}$`, "i"),
      };
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};

      if (req.query.minPrice) {
        queryObj.price.$gte = Number(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        queryObj.price.$lte = Number(req.query.maxPrice);
      }
    }

    // Filter in-stock products
    if (req.query.inStock === "true") {
      queryObj.stock = { $gt: 0 };
    }

    // Sorting
    let sortObj = { createdAt: -1 };

    if (req.query.sort) {
      const sortMap = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        rating: { rating: -1 },
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
      };

      sortObj = sortMap[req.query.sort] || sortObj;
    }

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 8);
    const skip = (page - 1) * limit;

    // Fetch products and total count
    const [products, total] = await Promise.all([
      Product.find(queryObj)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select("-reviews")
        .populate("createdBy", "name email"),

      Product.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("reviews.user", "name avatar");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Product not found — invalid ID format",
      });
    }

    next(error);
  }
};

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      image,
      stock,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, description, price and category",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      brand,
      image,
      stock: stock || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      image,
      stock,
    } = req.body;

    // Allow only specific fields to be updated
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (description !== undefined)
      updateFields.description = description;
    if (price !== undefined) updateFields.price = price;
    if (category !== undefined) updateFields.category = category;
    if (brand !== undefined) updateFields.brand = brand;
    if (image !== undefined) updateFields.image = image;
    if (stock !== undefined) updateFields.stock = stock;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Product not found — invalid ID format",
      });
    }

    next(error);
  }
};

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Product not found — invalid ID format",
      });
    }

    next(error);
  }
};

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    // Validate review fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating and comment",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prevent duplicate reviews
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Create review
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);

    // Update rating statistics
    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Product not found — invalid ID format",
      });
    }

    next(error);
  }
};

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct("category");

    res.status(200).json({
      success: true,
      categories: categories.sort(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
};