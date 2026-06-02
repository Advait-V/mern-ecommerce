// controllers/productController.js

const Product = require('../models/Product');

const buildSearchCondition = (keyword) => {
  // Escape special regex characters to prevent regex injection attacks
  // If user types "laptop+" the + would break the regex without escaping
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return {
    $or: [
      // Option 1: MongoDB full-text search
      // Fast because it uses a pre-built text index
      // Best for full word matches: "laptop" finds "laptop"
      { $text: { $search: keyword } },

      // Option 2: Partial match on product name
      // Catches partial words: "iphon" finds "iPhone"
      { name: { $regex: escaped, $options: 'i' } },

      // Option 3: Partial match on category
      // "electro" finds "Electronics"
      { category: { $regex: escaped, $options: 'i' } },

      // Option 4: Partial match on brand
      // "sams" finds "Samsung"
      { brand: { $regex: escaped, $options: 'i' } },

      // Option 5: Partial match on description
      // "noise cancel" finds products describing noise cancellation
      { description: { $regex: escaped, $options: 'i' } },
    ],
  };
};

// ─── @route   GET /api/products ───────────────────────────────────────────────
// @desc    Get all products with fuzzy search, filter, sort & pagination
// @access  Public
const getAllProducts = async (req, res, next) => {
  try {
    // ── 1. Build the filter object ───────────────────────────────────────────
    const queryObj = {};

    // ── Fuzzy Search ─────────────────────────────────────────────────────────
    // CHANGED: was { $text: { $search: keyword } }
    // NOW:     uses buildSearchCondition for fuzzy matching
    if (req.query.keyword && req.query.keyword.trim() !== '') {
      const keyword = req.query.keyword.trim();
      Object.assign(queryObj, buildSearchCondition(keyword));
      // Object.assign copies all properties from buildSearchCondition
      // into queryObj — same as spreading: { ...queryObj, ...$or condition }
    }

    // ── Category Filter ───────────────────────────────────────────────────────
    // Case-insensitive exact category match
    // /^Electronics$/i matches "Electronics", "electronics", "ELECTRONICS"
    // ^ means start of string, $ means end of string
    // This prevents "Electronics" from matching "Super Electronics Store"
    if (req.query.category) {
      queryObj.category = {
        $regex:   new RegExp(`^${req.query.category}$`, 'i'),
        $options: 'i',
      };
    }

    // ── Price Range Filter ────────────────────────────────────────────────────
    // $gte = greater than or equal (>=)
    // $lte = less than or equal (<=)
    // We only add each bound if the user actually sent it
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};

      if (req.query.minPrice) {
        // Number() converts string "100" from URL to number 100
        // Without this, MongoDB compares "100" > "50" as strings
        // which gives wrong results ("9" > "100" as a string!)
        queryObj.price.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        queryObj.price.$lte = Number(req.query.maxPrice);
      }
    }

    // ── In Stock Filter ───────────────────────────────────────────────────────
    // $gt: 0 means stock must be greater than zero
    if (req.query.inStock === 'true') {
      queryObj.stock = { $gt: 0 };
    }

    // ── 2. Sort ───────────────────────────────────────────────────────────────
    // MongoDB sort: 1 = ascending, -1 = descending
    let sortObj = { createdAt: -1 }; // default: newest first

    const sortMap = {
      price_asc:  { price:     1  },
      price_desc: { price:    -1  },
      rating:     { rating:   -1  },
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
    };

    if (req.query.sort && sortMap[req.query.sort]) {
      sortObj = sortMap[req.query.sort];
    }

    // ── 3. Pagination ─────────────────────────────────────────────────────────
    // Math.max(1, ...) ensures page is never less than 1
    // Math.min(50, ...) ensures limit never exceeds 50 (prevents abuse)
    const page  = Math.max(1,  Number(req.query.page)  || 1);
    const limit = Math.min(50, Number(req.query.limit) || 8);
    const skip  = (page - 1) * limit;
    // page=1 → skip 0  (show items 1-8)
    // page=2 → skip 8  (show items 9-16)
    // page=3 → skip 16 (show items 17-24)

    // ── 4. Execute queries in parallel ────────────────────────────────────────
    // Promise.all runs both queries simultaneously
    // Faster than: await products, then await total (sequential)
    const [products, total] = await Promise.all([
      Product.find(queryObj)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-reviews')
        // Exclude reviews array from list view
        // Reviews are only needed on the detail page
        // Sending them in list view wastes bandwidth
        .populate('createdBy', 'name email'),

      Product.countDocuments(queryObj),
      // Count must use same queryObj so the total
      // reflects the filtered results, not all products
    ]);

    res.status(200).json({
      success:  true,
      total,
      page,
      pages:    Math.ceil(total / limit),
      count:    products.length,
      products,
    });

  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/products/categories ───────────────────────────────────
// @desc    Get all unique categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    // .distinct() returns unique values for a field
    // Much more efficient than fetching all products
    // and manually extracting unique categories
    const categories = await Product.distinct('category');

    res.status(200).json({
      success:    true,
      categories: categories.sort(), // alphabetical order
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/products/:id ──────────────────────────────────────────
// @desc    Get single product by ID
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy',    'name email')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({ success: true, product });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found — invalid ID format',
      });
    }
    next(error);
  }
};

// ─── @route   POST /api/products ─────────────────────────────────────────────
// @desc    Create new product (admin only)
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name, description, price,
      category, brand, image, stock,
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, price and category',
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      brand,
      image,
      stock:     stock || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, product });

  } catch (error) {
    next(error);
  }
};

// ─── @route   PUT /api/products/:id ──────────────────────────────────────────
// @desc    Update product (admin only)
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    // Whitelist allowed fields
    // Prevents someone sending { createdBy: 'hacker' }
    const {
      name, description, price,
      category, brand, image, stock,
    } = req.body;

    // Build update object with only fields that were sent
    // undefined fields are excluded so we don't overwrite with null
    const updateFields = {};
    if (name        !== undefined) updateFields.name        = name;
    if (description !== undefined) updateFields.description = description;
    if (price       !== undefined) updateFields.price       = price;
    if (category    !== undefined) updateFields.category    = category;
    if (brand       !== undefined) updateFields.brand       = brand;
    if (image       !== undefined) updateFields.image       = image;
    if (stock       !== undefined) updateFields.stock       = stock;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new:            true,  // return updated document
        runValidators:  true,  // run schema validators on new values
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({ success: true, product });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found — invalid ID format',
      });
    }
    next(error);
  }
};

// ─── @route   DELETE /api/products/:id ───────────────────────────────────────
// @desc    Delete product (admin only)
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Use deleteOne on the document instance (not findByIdAndDelete)
    // so any pre-delete middleware hooks on the schema fire correctly
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found — invalid ID format',
      });
    }
    next(error);
  }
};

// ─── @route   POST /api/products/:id/reviews ─────────────────────────────────
// @desc    Add review to product
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating and comment',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user already reviewed this product
    // .toString() converts ObjectId to string for comparison
    // ObjectId === ObjectId is always false (different references)
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Add the review
    product.reviews.push({
      user:    req.user._id,
      name:    req.user.name,
      rating:  Number(rating),
      comment,
    });

    // Recalculate aggregate rating
    product.numReviews = product.reviews.length;
    product.rating     =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success:    true,
      message:    'Review added successfully',
      rating:     product.rating,
      numReviews: product.numReviews,
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found — invalid ID format',
      });
    }
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
};
