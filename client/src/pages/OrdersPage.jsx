// src/pages/OrdersPage.jsx
// Lists all of the logged-in user's past orders.
// Clicking a row navigates to OrderDetailPage.

import { useState, useEffect }    from 'react';
import { Link }                   from 'react-router-dom';
import { fetchMyOrders }          from '../api/orderApi';
import Spinner                    from '../components/ui/Spinner';
import Message                    from '../components/ui/Message';
import { formatCurrency }         from '../utils/formatCurrency';
import useTitle                   from '../hooks/useTitle';

const STATUS_STYLES = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3' },
  delivered:  { bg: '#dcfce7', color: '#166534' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

const OrdersPage = () => {
  useTitle('My Orders');

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyOrders();
        setOrders(data.orders);
      } catch (err) {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 style={styles.pageTitle}>My Orders</h1>

      {error && <Message type="error">{error}</Message>}

      {orders.length === 0 ? (
        // Empty state
        <div style={styles.emptyState}>
          <span style={{ fontSize: '3.5rem' }}>📦</span>
          <h2 style={styles.emptyTitle}>No orders yet</h2>
          <p style={styles.emptyText}>
            When you place an order, it will appear here.
          </p>
          <Link to="/products" style={styles.shopLink}>
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div style={styles.tableWrapper}>

          {/* Table header */}
          <div style={styles.tableHeader}>
            <span style={{ flex: 2 }}>Order ID</span>
            <span style={{ flex: 2 }}>Date</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Payment</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
            <span style={{ flex: 0.5 }} />
          </div>

          {/* Order rows */}
          {orders.map((order) => {
            const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            return (
              <div key={order._id} style={styles.orderRow}>

                {/* Order ID (short) */}
                <span style={{ flex: 2, ...styles.orderId }}>
                  #{order._id.slice(-8).toUpperCase()}
                </span>

                {/* Date */}
                <span style={{ flex: 2, color: '#475569', fontSize: '0.875rem' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>

                {/* Total */}
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {formatCurrency(order.totalPrice)}
                </span>

                {/* Payment status */}
                <span style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: order.isPaid ? '#166534' : '#92400e',
                    backgroundColor: order.isPaid ? '#dcfce7' : '#fef3c7',
                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                  }}>
                    {order.isPaid ? '✓ Paid' : 'Pending'}
                  </span>
                </span>

                {/* Order status */}
                <span style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    backgroundColor: s.bg, color: s.color,
                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                  }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </span>

                {/* Details link */}
                <span style={{ flex: 0.5, textAlign: 'right' }}>
                  <Link
                    to={`/orders/${order._id}`}
                    style={styles.detailLink}
                  >
                    View →
                  </Link>
                </span>

              </div>
            );
          })}

        </div>
      )}
    </div>
  );
};

const styles = {
  pageTitle:    { fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' },
  tableWrapper: { backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableHeader:  { display: 'flex', padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' },
  orderRow:     { display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc', transition: 'background-color 0.15s' },
  orderId:      { fontWeight: 700, fontSize: '0.875rem', color: '#3b82f6', fontFamily: 'monospace' },
  detailLink:   { color: '#3b82f6', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' },
  emptyState:   { textAlign: 'center', padding: '5rem 2rem', maxWidth: '380px', margin: '0 auto' },
  emptyTitle:   { fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '1rem 0 0.5rem' },
  emptyText:    { color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' },
  shopLink:     { display: 'inline-block', backgroundColor: '#3b82f6', color: '#fff', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 700 },
};

export default OrdersPage;