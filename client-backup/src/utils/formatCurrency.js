// src/utils/formatCurrency.js
// Consistent currency formatting across the entire app

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  // Output: ₹1,29,999
};