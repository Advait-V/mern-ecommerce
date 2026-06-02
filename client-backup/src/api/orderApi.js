// src/api/orderApi.js

import axiosInstance from './axiosInstance';

// Place a new order
export const placeOrder = async (orderData) => {
  const { data } = await axiosInstance.post('/orders', orderData);
  return data;
};

// My order history
export const fetchMyOrders = async () => {
  const { data } = await axiosInstance.get('/orders/my');
  return data;
};

// Single order detail
export const fetchOrderById = async (id) => {
  const { data } = await axiosInstance.get(`/orders/${id}`);
  return data;
};

// Mark order as paid (after Stripe)
export const payOrder = async (id, paymentResult) => {
  const { data } = await axiosInstance.put(`/orders/${id}/pay`, paymentResult);
  return data;
};

// ── Admin ──────────────────────────────────────────────────────────────────────

export const fetchAllOrders = async (params = {}) => {
  const { data } = await axiosInstance.get('/orders', { params });
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await axiosInstance.put(`/orders/${id}/status`, { status });
  return data;
};