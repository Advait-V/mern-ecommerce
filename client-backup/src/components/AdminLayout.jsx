// src/components/AdminLayout.jsx
//
// Shared wrapper for all admin pages.
// Provides a consistent sidebar nav + page content area.
// Any page that imports this gets the sidebar automatically.
//
// Usage:
//   <AdminLayout title="Products">
//     <YourPageContent />
//   </AdminLayout>

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth }              from '../context/AuthContext';

// Nav items — add more here as you build more admin sections
const NAV_ITEMS = [
  { path: '/admin',          label: 'Dashboard',  icon: '📊', exact: true },
  { path: '/admin/products', label: 'Products',   icon: '📦' },
  { path: '/admin/orders',   label: 'Orders',     icon: '📋' },
];

const AdminLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.wrapper}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside style={styles.sidebar}>

        {/* Brand / admin label */}
        <div style={styles.sidebarHeader}>
          <span style={styles.brandIcon}>🛒</span>
          <div>
            <p style={styles.brandName}>MERNShop</p>
            <p style={styles.adminLabel}>Admin Panel</p>
          </div>
        </div>

        {/* Admin user info */}
        <div style={styles.adminInfo}>
          <div style={styles.adminAvatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={styles.adminName}>{user?.name}</p>
            <p style={styles.adminEmail}>{user?.email}</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              // NavLink adds 'active' class automatically when route matches
              // We use the style prop for inline styling based on isActive
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? '#3b82f6'  : 'transparent',
                color:           isActive ? '#ffffff'  : '#cbd5e1',
              })}
              // exact match for dashboard so /admin/products doesn't
              // also highlight the Dashboard link
              end={item.exact}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: back to store + logout */}
        <div style={styles.sidebarFooter}>
          <NavLink to="/" style={styles.storeLink}>
            ← Back to Store
          </NavLink>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <main style={styles.main}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>{title}</h1>
          <p style={styles.pageDate}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric',
              month: 'long',   day: 'numeric',
            })}
          </p>
        </div>

        {/* Page-specific content rendered here */}
        {children}
      </main>

    </div>
  );
};

const styles = {
  wrapper:      { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' },
  sidebar: {
    width:           '240px',
    flexShrink:      0,
    backgroundColor: '#1e293b',
    display:         'flex',
    flexDirection:   'column',
    position:        'sticky',
    top:             0,
    height:          '100vh',
    overflowY:       'auto',
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1.25rem', borderBottom: '1px solid #334155' },
  brandIcon:     { fontSize: '1.5rem' },
  brandName:     { color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 },
  adminLabel:    { color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  adminInfo:     { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid #334155' },
  adminAvatar:   { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
  adminName:     { color: '#f1f5f9', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  adminEmail:    { color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  nav:           { padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 },
  navLink:       { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.15s' },
  navIcon:       { fontSize: '1rem', width: '20px', textAlign: 'center' },
  sidebarFooter: { padding: '1rem 1.25rem', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  storeLink:     { color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', padding: '0.4rem 0' },
  logoutBtn:     { background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' },
  main:          { flex: 1, padding: '2rem', overflowX: 'hidden', minWidth: 0 },
  pageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.5rem' },
  pageTitle:     { fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' },
  pageDate:      { color: '#94a3b8', fontSize: '0.875rem' },
};

export default AdminLayout;