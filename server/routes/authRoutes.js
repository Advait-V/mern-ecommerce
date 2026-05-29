// routes/authRoutes.js

const express = require("express");

const router = express.Router();

// Controller functions
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
} = require("../controllers/authController");

// Authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);

router.post("/login", login);

// Private routes
router.get("/me", protect, getMe);

router.put("/updateProfile", protect, updateProfile);

router.put("/updatePassword", protect, updatePassword);

module.exports = router;