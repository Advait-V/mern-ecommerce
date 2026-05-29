// src/api/authApi.js
// All authentication-related API calls

import axiosInstance from './axiosInstance';

// Register a new user
// @param {Object} userData - { name, email, password }
export const registerUser = async (userData) => {
  const { data } = await axiosInstance.post('/auth/register', userData);
  // data = { success, token, user }
  return data;
};

// Login
// @param {Object} credentials - { email, password }
export const loginUser = async (credentials) => {
  const { data } = await axiosInstance.post('/auth/login', credentials);
  return data;
};

// Get current logged-in user's profile
// Token auto-attached by request interceptor
export const getMyProfile = async () => {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
};

// Update profile (name, avatar)
export const updateProfile = async (profileData) => {
  const { data } = await axiosInstance.put('/auth/updateprofile', profileData);
  return data;
};

// Change password
export const updatePassword = async (passwordData) => {
  const { data } = await axiosInstance.put('/auth/updatepassword', passwordData);
  return data;
};