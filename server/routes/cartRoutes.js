// routes/cartRoutes.js
// All cart routes are private — you must be logged in to have a cart

const express = require('express');
const router  = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

const { protect } = require('../middleware/authMiddleware');

// All routes protected — cart belongs to a logged-in user
router.use(protect); // applies protect to ALL routes below in one line

// GET    /api/cart           → fetch cart
// POST   /api/cart           → add item
// DELETE /api/cart           → clear entire cart
router
  .route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

// PUT    /api/cart/:productId  → update item quantity
// DELETE /api/cart/:productId  → remove specific item
router
  .route('/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

module.exports = router;