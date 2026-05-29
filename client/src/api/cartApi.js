// src/api/cartApi.js

import axiosInstance from './axiosInstance';

export const fetchCart = async () => {
  const { data } = await axiosInstance.get('/cart');
  return data;
};

// @param {string} productId
// @param {number} quantity
export const addItemToCart = async (productId, quantity = 1) => {
  const { data } = await axiosInstance.post('/cart', { productId, quantity });
  return data;
};

export const updateCartItemQty = async (productId, quantity) => {
  const { data } = await axiosInstance.put(`/cart/${productId}`, { quantity });
  return data;
};

export const removeItemFromCart = async (productId) => {
  const { data } = await axiosInstance.delete(`/cart/${productId}`);
  return data;
};

export const clearCartApi = async () => {
  const { data } = await axiosInstance.delete('/cart');
  return data;
};