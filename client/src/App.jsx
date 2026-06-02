// src/App.jsx
//
// The root component of the entire application.
// Three responsibilities only:
//   1. Wrap the app in global providers (Auth, Cart)
//   2. Define all routes
//   3. Apply global styles
//
// This file should never contain business logic.
// It is purely structural.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer }               from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Design system
import { GlobalStyles } from './design-system';

// Global state providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Route guards
import PrivateRoute from './components/PrivateRoute';
import AdminRoute   from './components/AdminRoute';

// Layout
import Navbar from './components/layout/Navbar';

// Pages — Public
import HomePage          from './pages/HomePage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import ProductsPage      from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

// Pages — Private
import CartPage        from './pages/CartPage';
import CheckoutPage    from './pages/CheckoutPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage     from './pages/ProfilePage';

// Pages — Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts  from './pages/admin/AdminProducts';
import AdminOrders    from './pages/admin/AdminOrders';

function App() {
  return (
    <BrowserRouter>
      {/* Injects CSS reset and base styles into <head> */}
      <GlobalStyles />

      {/* AuthProvider must wrap CartProvider           */}
      {/* because CartContext reads from AuthContext    */}
      <AuthProvider>
        <CartProvider>

          {/* Navbar appears on every page */}
          <Navbar />

          {/* Main content area */}
          <main>
            <Routes>

              {/* ── Public Routes ──────────────────── */}
              <Route path="/"            element={<HomePage />} />
              <Route path="/login"       element={<LoginPage />} />
              <Route path="/register"    element={<RegisterPage />} />
              <Route path="/products"    element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />

              {/* ── Private Routes ─────────────────── */}
              <Route path="/cart" element={
                <PrivateRoute><CartPage /></PrivateRoute>
              }/>
              <Route path="/checkout" element={
                <PrivateRoute><CheckoutPage /></PrivateRoute>
              }/>
              <Route path="/orders" element={
                <PrivateRoute><OrdersPage /></PrivateRoute>
              }/>
              <Route path="/orders/:id" element={
                <PrivateRoute><OrderDetailPage /></PrivateRoute>
              }/>
              <Route path="/profile" element={
                <PrivateRoute><ProfilePage /></PrivateRoute>
              }/>

              {/* ── Admin Routes ────────────────────── */}
              <Route path="/admin" element={
                <AdminRoute><AdminDashboard /></AdminRoute>
              }/>
              <Route path="/admin/products" element={
                <AdminRoute><AdminProducts /></AdminRoute>
              }/>
              <Route path="/admin/orders" element={
                <AdminRoute><AdminOrders /></AdminRoute>
              }/>

              {/* ── 404 ─────────────────────────────── */}
              <Route path="*" element={
                <div style={{
                  textAlign: 'center',
                  padding:   '4rem 2rem',
                }}>
                  <h2>404 — Page Not Found</h2>
                </div>
              }/>

            </Routes>
          </main>

          {/* Toast notifications — rendered at app level  */}
          {/* so any component can trigger them            */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
          />

        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;