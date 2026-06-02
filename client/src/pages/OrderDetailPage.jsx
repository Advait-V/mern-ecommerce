// src/pages/OrderDetailPage.jsx
//
// Shows complete details for one order.
// Accessed via:
//   /orders/:id  — from order history or post-checkout redirect
//
// Shows a success banner when coming from checkout (location.state.fromCheckout)

import { useState, useEffect }              from 'react';
import { useParams, useLocation, Link }     from 'react-router-dom';
import { fetchOrderById }                   from '../api/orderApi';
import Spinner                              from '../components/ui/Spinner';
import Message                             from '../components/ui/Message';
import { formatCurrency }                  from '../utils/formatCurrency';
import useTitle                            from '../hooks/useTitle';

// Status badge colours for each order lifecycle stage
const STATUS_STYLES = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3' },
  delivered:  { bg: '#dcfce7', color: '#166534' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

const OrderDetailPage = () => {
  const { id }    = useParams();
  const location  = useLocation();

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Was this page reached right after placing an order?
  const fromCheckout = location.state?.fromCheckout || false;
  
  // Was this page reached right after successful payment?
  const fromPayment = location.state?.fromPayment || false;

  useTitle(order ? `Order #${order._id.slice(-8).toUpperCase()}` : 'Order');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchOrderById(id);
        setOrder(data.order);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'You are not authorised to view this order'
            : 'Order not found'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Spinner />;
  if (error)   return (
    <div className="page">
      <Message type="error">{error}</Message>
      <Link to="/orders" style={{ color: '#3b82f6' }}>← Back to orders</Link>
    </div>
  );
  if (!order) return null;

  const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  return (
    <div className="page">

      {/* Success banner shown right after checkout */}
      {fromCheckout && (
        <div style={styles.successBanner}>
          🎉 Order placed successfully! We'll send you updates on your order.
        </div>
      )}

      {/* Payment success banner */}
      {fromPayment && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          fontWeight: 600,
        }}>
          💳 Payment confirmed! Your order is now being processed.
        </div>
      )}

      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p style={styles.orderDate}>
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        {/* Status badge */}
        <span style={{
          ...styles.statusBadge,
          backgroundColor: statusStyle.bg,
          color:           statusStyle.color,
        }}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div style={styles.layout}>

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div style={styles.leftCol}>

          {/* Order items */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Items Ordered</h2>
            {order?.orderItems?.map((item, i) => (
              <div key={i} style={styles.orderItem}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={styles.itemImg}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/64'; }}
                />
                <div style={{ flex: 1 }}>
                  <Link
                    to={`/products/${item.product}`}
                    style={styles.itemNameLink}
                  >
                    {item.name}
                  </Link>
                  <p style={styles.itemMeta}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <span style={styles.itemSubtotal}>
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </section>

          {/* Shipping address */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Shipping Address</h2>
            <div style={styles.addressBlock}>
              <p style={styles.addressName}>{order.shippingAddress.fullName}</p>
              <p style={styles.addressText}>{order.shippingAddress.address}</p>
              <p style={styles.addressText}>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p style={styles.addressText}>{order.shippingAddress.country}</p>
              <p style={{ ...styles.addressText, marginTop: '0.5rem' }}>
                📞 {order.shippingAddress.phone}
              </p>
            </div>
          </section>

        </div>

        {/* ── Right column: payment + summary ──────────────────────────── */}
        <div style={styles.rightCol}>

          {/* Payment info */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Payment</h2>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Method</span>
              <span style={styles.infoValue}>
                {order.paymentMethod === 'cod'
                  ? '💵 Cash on Delivery'
                  : '💳 Card (Stripe)'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Status</span>
              <span style={{
                ...styles.infoValue,
                color: order.isPaid ? '#16a34a' : '#dc2626',
                fontWeight: 700,
              }}>
                {order.isPaid
                  ? `✓ Paid on ${new Date(order.paidAt).toLocaleDateString()}`
                  : '✕ Not yet paid'}
              </span>
            </div>
          </section>

          {/* Order summary */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Price Summary</h2>
            <div style={styles.priceLines}>
              <PriceLine label="Items"    value={formatCurrency(order.itemsPrice)} />
              <PriceLine
                label="Shipping"
                value={order.shippingPrice === 0 ? 'FREE' : formatCurrency(order.shippingPrice)}
                green={order.shippingPrice === 0}
              />
              <PriceLine label="Tax"      value={formatCurrency(order.taxPrice)} />
            </div>
            <div style={styles.totalRow}>
              <span>Total</span>
              <span>{formatCurrency(order.totalPrice)}</span>
            </div>
          </section>

          {/* Navigation */}
          <Link to="/orders" style={styles.backLink}>
            ← Back to My Orders
          </Link>

        </div>

      </div>
    </div>
  );
};

const PriceLine = ({ label, value, green = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{label}</span>
    <span style={{ fontWeight: 600, color: green ? '#16a34a' : '#0f172a', fontSize: '0.9rem' }}>
      {value}
    </span>
  </div>
);

const styles = {
  successBanner: { backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontWeight: 600 },
  pageHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  pageTitle:    { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' },
  orderDate:    { color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' },
  statusBadge:  { padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 700 },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' },
  leftCol:      { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  rightCol:     { display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '80px' },
  card:         { backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardTitle:    { fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' },
  orderItem:    { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' },
  itemImg:      { width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#f8fafc', flexShrink: 0 },
  itemNameLink: { fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' },
  itemMeta:     { fontSize: '0.8rem', color: '#94a3b8' },
  itemSubtotal: { fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', flexShrink: 0 },
  addressBlock: { lineHeight: 1.8 },
  addressName:  { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' },
  addressText:  { color: '#475569', fontSize: '0.9rem' },
  infoRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' },
  infoLabel:    { color: '#64748b', fontSize: '0.875rem' },
  infoValue:    { fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 },
  priceLines:   { marginBottom: '0.5rem' },
  totalRow:     { display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', borderTop: '2px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem' },
  backLink:     { color: '#3b82f6', fontSize: '0.9rem', display: 'block', padding: '0.5rem 0' },
};

export default OrderDetailPage;