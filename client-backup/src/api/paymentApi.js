// src/api/paymentApi.js

import axiosInstance from './axiosInstance';

// Create a Stripe PaymentIntent for the given order
// Returns { clientSecret, amount }
export const createPaymentIntent = async (orderId) => {
  const { data } = await axiosInstance.post('/payment/create-intent', { orderId });
  return data;
};