// src/pages/admin/AdminDashboard.jsx
//
// Overview page showing key business metrics.
// Fetches data from two APIs simultaneously using Promise.all.

import { useState, useEffect }         from 'react';
import { Link }                        from 'react-router-dom';
import { fetchAllOrders }              from '../../api/orderApi';
import { fetchProducts }               from '../../api/productApi';
import AdminLayout                     from '../../components/AdminLayout';
import Spinner                         from '../../components/ui/Spinner';
import { formatCurrency }              from '../../utils/formatCurrency';

// Status badge styles (same as other pages)
const STATUS_COLORS = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3' },
  delivered:  { bg: '#dcfce7', color: '#166534' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

const AdminDashboard = () => {
  const [stats,          setStats]          = useState(null);
  const [recentOrders,   setRecentOrders]   = useState([]);
  const [lowStockItems,  setLowStockItems]  = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fetch both in parallel — faster than sequential await calls
        const [ordersData, productsData] = await Promise.all([
          fetchAllOrders({ limit: 5 }),      // last 5 orders for recent table
          fetchProducts({ limit: 100 }),     // all products for stats + stock check
        ]);

        // Build stats object from the responses
        setStats({
          totalRevenue:   ordersData.totalRevenue || 0,
          totalOrders:    ordersData.total        || 0,
          totalProducts:  productsData.total      || 0,
          pendingOrders:  ordersData.orders.filter(
            (o) => o.status === 'pending'
          ).length,
        });

        setRecentOrders(ordersData.orders);

        // Flag products with 5 or fewer units left
        const low = productsData.products.filter((p) => p.stock <= 5);
        setLowStockItems(low);

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return (
    <AdminLayout title="Dashboard"><Spinner /></AdminLayout>
  );

  return (
    <AdminLayout title="Dashboard">

      {/* ── Stat cards row ──────────────────────────────────────────────── */}
      <div style={styles.statsGrid}>
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          color="#3b82f6"
          bg="#eff6ff"
        />
        <StatCard
          icon="📋"
          label="Total Orders"
          value={stats?.totalOrders || 0}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
        <StatCard
          icon="📦"
          label="Total Products"
          value={stats?.totalProducts || 0}
          color="#0891b2"
          bg="#ecfeff"
        />
        <StatCard
          icon="⏳"
          label="Pending Orders"
          value={stats?.pendingOrders || 0}
          color="#f59e0b"
          bg="#fffbeb"
        />
      </div>

      {/* ── Bottom two-column section ────────────────────────────────────── */}
      <div style={styles.bottomGrid}>

        {/* Recent orders table */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Recent Orders</h2>
            <Link to="/admin/orders" style={styles.viewAllLink}>
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={styles.emptyMsg}>No orders yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                  return (
                    <tr key={order._id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link
                          to={`/orders/${order._id}`}
                          style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' }}
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                          {order.user?.name || 'Unknown'}
                        </span>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {order.user?.email}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, fontSize: '0.9rem' }}>
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          backgroundColor: sc.bg, color: sc.color,
                          padding: '0.2rem 0.6rem', borderRadius: '999px',
                          fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Low stock alerts */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>⚠️ Low Stock</h2>
            <Link to="/admin/products" style={styles.viewAllLink}>
              Manage →
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={styles.allGoodMsg}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <p style={{ color: '#166534', fontWeight: 600, marginTop: '0.5rem' }}>
                All products are well-stocked!
              </p>
            </div>
          ) : (
            <div style={styles.stockList}>
              {lowStockItems.map((product) => (
                <div key={product._id} style={styles.stockItem}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={styles.stockImg}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.stockName}>{product.name}</p>
                    <p style={styles.stockCategory}>{product.category}</p>
                  </div>
                  {/* Color-code: 0 = red, 1-2 = orange, 3-5 = yellow */}
                  <span style={{
                    fontWeight: 800,
                    fontSize:   '0.9rem',
                    color: product.stock === 0 ? '#dc2626'
                         : product.stock <= 2  ? '#ea580c'
                         : '#ca8a04',
                  }}>
                    {product.stock === 0 ? 'Out' : `${product.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </AdminLayout>
  );
};

// ── StatCard sub-component ────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{ ...styles.statCard, backgroundColor: bg }}>
    <div style={{ ...styles.statIconWrapper, backgroundColor: color }}>
      <span style={styles.statIcon}>{icon}</span>
    </div>
    <div>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color }}>{value}</p>
    </div>
  </div>
);

const styles = {
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' },
  statCard:    { borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIconWrapper: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statIcon:    { fontSize: '1.4rem' },
  statLabel:   { color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' },
  statValue:   { fontSize: '1.6rem', fontWeight: 800 },
  bottomGrid:  { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' },
  card:        { backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  cardTitle:   { fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
  viewAllLink: { color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' },
  emptyMsg:    { color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { borderBottom: '2px solid #f1f5f9' },
  th:          { textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' },
  tr:          { borderBottom: '1px solid #f8fafc' },
  td:          { padding: '0.85rem 0.75rem', verticalAlign: 'middle' },
  stockList:   { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  stockItem:   { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  stockImg:    { width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', backgroundColor: '#f8fafc', flexShrink: 0 },
  stockName:   { fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stockCategory: { fontSize: '0.75rem', color: '#94a3b8' },
  allGoodMsg:  { textAlign: 'center', padding: '1.5rem 0' },
};

export default AdminDashboard;