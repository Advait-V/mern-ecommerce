// routes/paymentRoutes.js
//
// IMPORTANT: The webhook route must use express.raw() middleware
// NOT express.json() — Stripe needs the raw body to verify the signature.
// We handle this special case directly in this file.

const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentIntent,
  stripeWebhook,
} = require('../controllers/paymentController');

// POST /api/payment/create-intent
// Protected — user must be logged in to create a payment intent
router.post('/create-intent', protect, createPaymentIntent);

// POST /api/payment/webhook
// Public — called by Stripe's servers, NOT by your frontend
// express.raw() reads the body as a Buffer (required for signature verification)
// This MUST be registered BEFORE any express.json() middleware for this route
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // raw body — do NOT use express.json() here
  stripeWebhook
);

module.exports = router;