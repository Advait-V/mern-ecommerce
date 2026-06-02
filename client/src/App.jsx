// src/App.jsx
// The root component — defines all routes and wraps the app in providers
//
// Provider order matters:
//   AuthProvider must wrap CartProvider (Cart uses useAuth internally)
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar       from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute   from './components/AdminRoute';

// Pages — we'll build these in Steps 7-10
// For now they're placeholders so the app compiles
import HomePage          from './pages/HomePage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import ProductsPage      from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage          from './pages/CartPage';
import CheckoutPage      from './pages/CheckoutPage';
import OrdersPage        from './pages/OrdersPage';
import OrderDetailPage   from './pages/OrderDetailPage';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminProducts     from './pages/admin/AdminProducts';
import AdminOrders       from './pages/admin/AdminOrders';

function App() {
  return (
    // BrowserRouter enables client-side routing
    <BrowserRouter>
      {/* AuthProvider wraps everything — any component can read auth state */}
      <AuthProvider>
        {/* CartProvider wraps everything inside Auth — uses auth state */}
        <CartProvider>

          {/* Navbar is always visible on every page */}
          <Navbar />

          {/* Main content area */}
          <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Routes>
              {/* ── Public routes ──────────────────────────────── */}
              <Route path="/"           element={<HomePage />} />
              <Route path="/login"      element={<LoginPage />} />
              <Route path="/register"   element={<RegisterPage />} />
              <Route path="/products"   element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />

              {/* ── Private routes (login required) ────────────── */}
              <Route path="/cart" element={
                <PrivateRoute><CartPage /></PrivateRoute>
              } />
              <Route path="/checkout" element={
                <PrivateRoute><CheckoutPage /></PrivateRoute>
              } />
              <Route path="/orders" element={
                <PrivateRoute><OrdersPage /></PrivateRoute>
              } />
              <Route path="/orders/:id" element={
                <PrivateRoute><OrderDetailPage /></PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute><ProfilePage /></PrivateRoute>
              } />
              <Route path="/payment/:id" element={
                <PrivateRoute><PaymentPage /></PrivateRoute>
              } />

              {/* ── Admin routes (admin role required) ─────────── */}
              <Route path="/admin" element={
                <AdminRoute><AdminDashboard /></AdminRoute>
              } />
              <Route path="/admin/products" element={
                <AdminRoute><AdminProducts /></AdminRoute>
              } />
              <Route path="/admin/orders" element={
                <AdminRoute><AdminOrders /></AdminRoute>
              } />

              {/* ── 404 fallback ────────────────────────────────── */}
              <Route path="*" element={
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <h2>404 — Page Not Found</h2>
                </div>
              } />
            </Routes>
          </main>

          {/* Toast notification container — renders toasts app-wide */}
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
