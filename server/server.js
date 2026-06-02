// Load environment variables before anything else
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();

// Connect to MongoDB
connectDB();

// Temporary model loading test (remove after verification)
const User = require("./models/user");
const Product = require("./models/product");
const Cart = require("./models/cart");
const Order = require("./models/order");

console.log("Models loaded:", {
  User: !!User,
  Product: !!Product,
  Cart: !!Cart,
  Order: !!Order,
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
// API Routes
app.use('/api/payment',  require('./routes/paymentRoutes'));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

console.log("✅ productRoutes file loaded");

app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/payment',  require('./routes/paymentRoutes'));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running !!",
    timestamp: new Date().toISOString(),
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const path = require('path');
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get((req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'build', 'index.html'));
  });  
}

app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});