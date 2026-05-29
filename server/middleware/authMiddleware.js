// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware to protect private routes
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Reject request if token is missing
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorised — no token provided",
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorised — user no longer exists",
      });
    }

    // Attach user to request object
    req.user = user;

    next();
  } catch (error) {
    // Invalid token
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Not authorised — invalid token",
      });
    }

    // Expired token
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Not authorised — token has expired",
      });
    }

    next(error);
  }
};

// Middleware to allow admin access only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied — admin only",
    });
  }
};

module.exports = {
  protect,
  adminOnly,
};