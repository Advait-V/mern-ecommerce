// controllers/authController.js

const User = require("../models/user");
const generateToken = require("../utils/generateToken.js");

// Helper function to generate token and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    const existigUser = await User.findOne({ email });

    if (existigUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use, please login or use a different email",
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: "user",
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user and return token
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare passwords
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @desc    Get logged-in user's profile
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/updateprofile
// @desc    Update logged-in user's profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    // Allow only specific fields to be updated
    const allowedUpdates = {
      name: req.body.name,
      avatar: req.body.avatar,
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(
      (key) =>
        allowedUpdates[key] === undefined &&
        delete allowedUpdates[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/updatepassword
// @desc    Change user password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    // Fetch user with password
    const user = await User.findById(req.user.id).select("+password");

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;

    await user.save();

    // Send new token after password update
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Export controller functions
module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
};