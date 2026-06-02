// src/api/productApi.js
// All product-related API calls

import axiosInstance from './axiosInstance';

// Get all products with optional filters
// @param {Object} params - { keyword, category, minPrice, maxPrice, sort, page, limit }
export const fetchProducts = async (params = {}) => {
  // axios automatically converts params object → query string
  // e.g. { keyword: 'laptop', page: 2 } → ?keyword=laptop&page=2
  const { data } = await axiosInstance.get('/products', { params });
  return data; // { success, total, page, pages, products }
};

// Get a single product by ID
export const fetchProductById = async (id) => {
  const { data } = await axiosInstance.get(`/products/${id}`);
  return data; // { success, product }
};

// Get all unique categories
export const fetchCategories = async () => {
  const { data } = await axiosInstance.get('/products/categories');
  return data; // { success, categories: [...] }
};

// ── Admin only ─────────────────────────────────────────────────────────────────

export const createProduct = async (productData) => {
  const { data } = await axiosInstance.post('/products', productData);
  return data;
};

export const updateProduct = async (id, productData) => {
  const { data } = await axiosInstance.put(`/products/${id}`, productData);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await axiosInstance.delete(`/products/${id}`);
  return data;
};

// Add a review to a product
export const addProductReview = async (id, reviewData) => {
  const { data } = await axiosInstance.post(`/products/${id}/reviews`, reviewData);
  return data;
};