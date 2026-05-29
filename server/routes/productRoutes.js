// routes/productRoutes.js

const express = require("express");

console.log("✅ productRoutes loaded");

const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
} = require("../controllers/productController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// Public route - get all categories
router.get("/categories", getCategories);

// Product collection routes
router
  .route("/")
  .get(getAllProducts)
  .post(protect, adminOnly, createProduct);

// Single product routes
router
  .route("/:id")
  .get(getProductById)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

// Review route
router.post("/:id/reviews", protect, addReview);

module.exports = router;