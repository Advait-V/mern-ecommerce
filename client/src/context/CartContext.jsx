// src/context/CartContext.jsx
//
// CartContext manages the cart state globally.
// The cart is fetched from the backend (persistent) but we also
// keep a local copy in state for instant UI updates.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addItemToCart,
         updateCartItemQty, removeItemFromCart, clearCartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart]         = useState({ items: [], totalPrice: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  // ── Fetch cart from backend whenever auth state changes ──────────────────
  // When user logs in → fetch their cart
  // When user logs out → clear cart from state
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCart({ items: [], totalPrice: 0 });
    }
  }, [isAuthenticated]); // re-run when isAuthenticated changes

  const loadCart = async () => {
    try {
      setCartLoading(true);
      const data = await fetchCart();
      setCart(data.cart);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setCartLoading(false);
    }
  };

  // ── addToCart ─────────────────────────────────────────────────────────────
  const addToCart = async (productId, quantity = 1) => {
    try {
      const data = await addItemToCart(productId, quantity);
      setCart(data.cart);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  // ── updateQty ─────────────────────────────────────────────────────────────
  const updateQty = async (productId, quantity) => {
    try {
      const data = await updateCartItemQty(productId, quantity);
      setCart(data.cart);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  };

  // ── removeFromCart ────────────────────────────────────────────────────────
  const removeFromCart = async (productId) => {
    try {
      const data = await removeItemFromCart(productId);
      setCart(data.cart);
      toast.info('Item removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = async () => {
    try {
      await clearCartApi();
      setCart({ items: [], totalPrice: 0 });
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  // Derived: total item count for the cart badge in Navbar
  const cartItemCount = cart.items?.reduce(
    (sum, item) => sum + item.quantity, 0
  ) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        cartItemCount,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};