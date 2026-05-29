// src/components/Navbar.jsx
// Top navigation bar — shows different links based on auth state

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      {/* Brand */}
      <Link to="/" style={styles.brand}>🛒 MERNShop</Link>

      {/* Navigation links */}
      <div style={styles.links}>
        <Link to="/products" style={styles.link}>Products</Link>

        {isAuthenticated ? (
          <>
            {/* Cart badge shows number of items */}
            <Link to="/cart" style={styles.link}>
              Cart
              {cartItemCount > 0 && (
                <span style={styles.badge}>{cartItemCount}</span>
              )}
            </Link>

            <Link to="/orders" style={styles.link}>My Orders</Link>
            <Link to="/profile" style={styles.link}>Profile</Link>
            {/* Admin dashboard link — only visible to admins */}
            {isAdmin && (
              <Link to="/admin" style={{ ...styles.link, color: '#f59e0b' }}>
                Admin
              </Link>
            )}

            <span style={styles.userName}>Hi, {user?.name?.split(' ')[0]}</span>

            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login"    style={styles.link}>Login</Link>
            <Link to="/register" style={styles.linkPrimary}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '0.75rem 2rem',
    backgroundColor: '#1e293b',
    color:           '#f1f5f9',
    position:        'sticky',
    top:             0,
    zIndex:          100,
    boxShadow:       '0 2px 8px rgba(0,0,0,0.3)',
  },
  brand:     { color: '#60a5fa', textDecoration: 'none',
               fontWeight: 700, fontSize: '1.25rem' },
  links:     { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  link:      { color: '#cbd5e1', textDecoration: 'none',
               fontSize: '0.95rem', position: 'relative' },
  linkPrimary: { color: '#fff', backgroundColor: '#3b82f6',
                 padding: '0.4rem 1rem', borderRadius: '6px',
                 textDecoration: 'none', fontSize: '0.9rem' },
  badge:     { backgroundColor: '#ef4444', color: '#fff', fontSize: '0.7rem',
               fontWeight: 700, borderRadius: '999px', padding: '1px 6px',
               marginLeft: '4px', verticalAlign: 'super' },
  userName:  { color: '#94a3b8', fontSize: '0.9rem' },
  logoutBtn: { background: 'none', border: '1px solid #475569',
               color: '#94a3b8', padding: '0.35rem 0.75rem',
               borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
};

export default Navbar;