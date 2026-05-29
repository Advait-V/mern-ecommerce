// routes/orderRoutes.js

const express = require('express');
const router  = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markOrderPaid,
} = require('../controllers/orderController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// All order routes require login
router.use(protect);

// ── User routes ───────────────────────────────────────────────────────────────

// POST   /api/orders          → place a new order
router.post('/', placeOrder);

// GET    /api/orders/my       → my order history
router.get('/my', getMyOrders);

// GET    /api/orders/:id      → single order detail
router.get('/:id', getOrderById);

// PUT    /api/orders/:id/pay  → mark as paid (after Stripe)
router.put('/:id/pay', markOrderPaid);

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET    /api/orders          → all orders (admin dashboard)
router.get('/', adminOnly, getAllOrders);

// PUT    /api/orders/:id/status → update order status
router.put('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;