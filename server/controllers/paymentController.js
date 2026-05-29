// controllers/paymentController.js
//
// Handles two things:
//   1. createPaymentIntent  → called when user is about to pay
//                             creates a Stripe PaymentIntent and returns
//                             the client_secret the frontend needs
//   2. stripeWebhook        → called by Stripe's servers when a payment
//                             event happens (succeeded, failed, etc.)
//                             This is how we RELIABLY know payment succeeded

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Pass the secret key directly to the Stripe constructor
// This initialises the Stripe SDK with your account credentials

const Order = require('../models/order');

// ─── @route   POST /api/payment/create-intent ─────────────────────────────
// @desc    Create a Stripe PaymentIntent for an order
// @access  Private (logged-in user, must own the order)
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required',
      });
    }

    // Fetch the order and verify ownership
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Security: only the order owner can pay for it
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorised to pay for this order',
      });
    }

    // Don't create a new intent if already paid
    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid',
      });
    }

    // Create a PaymentIntent with Stripe
    // amount must be in the SMALLEST currency unit
    // For INR: paise (1 rupee = 100 paise)
    // For USD: cents (1 dollar = 100 cents)
    // Math.round prevents floating point issues (e.g. 299.99 * 100 = 29998.999...)
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(order.totalPrice * 100),
      currency: 'inr',            // change to 'usd' if needed

      // metadata is stored on the Stripe dashboard — great for debugging
      metadata: {
        orderId:   order._id.toString(),
        userId:    req.user._id.toString(),
        userEmail: req.user.email,
      },

      // automatic_payment_methods handles cards and other payment methods
      // without needing to specify each one manually
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client_secret to the frontend
    // The frontend uses this to complete the payment with Stripe.js
    // NEVER return the full paymentIntent object — it contains sensitive data
    res.status(200).json({
      success:      true,
      clientSecret: paymentIntent.client_secret,
      amount:       order.totalPrice,
    });

  } catch (error) {
    // Stripe SDK throws errors with a 'type' field we can check
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: `Stripe error: ${error.message}`,
      });
    }
    next(error);
  }
};

// ─── @route   POST /api/payment/webhook ──────────────────────────────────
// @desc    Handle Stripe webhook events
// @access  Public (called by Stripe, not your frontend)
//
// WHY a webhook?
// The frontend could call /orders/:id/pay after payment succeeds,
// but what if the user closes their browser mid-payment?
// Webhooks guarantee the server is notified regardless of client state.
// Stripe sends a POST request to this endpoint directly.
//
// IMPORTANT: This route needs the RAW request body (not parsed JSON)
// to verify the webhook signature. We handle this in server.js.
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the request actually came from Stripe (not a fake request)
    // req.body is the RAW buffer here (see server.js for special middleware)
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Invalid signature — reject it
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific events
  // Stripe sends many event types — we only care about payment_intent.succeeded
  switch (event.type) {

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId       = paymentIntent.metadata.orderId;

      try {
        const order = await Order.findById(orderId);

        if (order && !order.isPaid) {
          order.isPaid        = true;
          order.paidAt        = new Date();
          order.status        = 'processing';
          order.paymentResult = {
            id:     paymentIntent.id,
            status: paymentIntent.status,
            email:  paymentIntent.receipt_email || '',
          };
          await order.save();
          console.log(`✅ Order ${orderId} marked as paid via webhook`);
        }
      } catch (err) {
        console.error('Failed to update order from webhook:', err);
        // Still return 200 to Stripe — otherwise it retries the webhook
        // Log the error and handle manually if needed
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log(`❌ Payment failed for order: ${paymentIntent.metadata.orderId}`);
      // Optionally: send an email to the user, update order status, etc.
      break;
    }

    default:
      // Ignore all other event types
      break;
  }

  // Must return 200 to acknowledge receipt
  // If you return any other status, Stripe will retry the webhook
  res.status(200).json({ received: true });
};

module.exports = { createPaymentIntent, stripeWebhook };