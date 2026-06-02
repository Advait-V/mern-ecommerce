// src/pages/CartPage.jsx
//
// Shows all items in the user's cart with:
//   - Quantity +/- controls (calls CartContext.updateQty)
//   - Remove button per item
//   - Price breakdown (items + shipping + tax)
//   - Proceed to Checkout button
//
// All cart operations go through CartContext which calls the backend API.
// The UI stays in sync because CartContext updates its state after every call.

import { Link, useNavigate }  from 'react-router-dom';
import { useCart }             from '../context/CartContext';
import Spinner                 from '../components/Spinner';
import { formatCurrency }      from '../utils/formatCurrency';
import useTitle                from '../hooks/useTitle';

const CartPage = () => {
  useTitle('My Cart');

  const {
    cart,
    cartLoading,
    updateQty,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();

  // ── Early states ───────────────────────────────────────────────────────────
  if (cartLoading) return <Spinner />;

  const isEmpty = !cart?.items || cart.items.length === 0;

  // ── Render: empty cart ─────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="page">
        <div style={styles.emptyState}>
          <span style={{ fontSize: '4rem' }}>🛒</span>
          <h2 style={styles.emptyTitle}>Your cart is empty</h2>
          <p style={styles.emptyText}>
            Looks like you haven't added anything yet.
          </p>
          <Link to="/products" style={styles.shopBtn}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // ── Render: cart with items ────────────────────────────────────────────────
  return (
    <div className="page">
      <h1 style={styles.pageTitle}>
        Shopping Cart
        <span style={styles.itemCount}>
          {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
        </span>
      </h1>

      <div style={styles.layout}>

        {/* ── Left column: cart items ─────────────────────────────────── */}
        <div style={styles.itemsCol}>

          {/* Column headers */}
          <div style={styles.tableHeader}>
            <span style={{ flex: 3 }}>Product</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
            <span style={{ flex: 0.5 }} />
          </div>

          {/* Cart item rows */}
          {cart.items.map((item) => (
            <CartItem
              key={item.product?._id || item.product}
              item={item}
              onUpdateQty={updateQty}
              onRemove={removeFromCart}
            />
          ))}

          {/* Continue shopping link */}
          <Link to="/products" style={styles.continueLink}>
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Right column: order summary ─────────────────────────────── */}
        <div style={styles.summaryCol}>
          <div style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            <div style={styles.summaryRows}>
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(cart.itemsPrice || 0)}
              />
              <SummaryRow
                label="Shipping"
                value={
                  cart.shippingPrice === 0
                    ? 'FREE'
                    : formatCurrency(cart.shippingPrice || 0)
                }
                valueStyle={
                  cart.shippingPrice === 0 ? { color: '#16a34a', fontWeight: 700 } : {}
                }
              />
              <SummaryRow
                label="Tax (18% GST)"
                value={formatCurrency(cart.taxPrice || 0)}
              />
            </div>

            {/* Shipping note */}
            {cart.itemsPrice < 999 && (
              <p style={styles.shippingNote}>
                💡 Add {formatCurrency(999 - (cart.itemsPrice || 0))} more
                for FREE shipping!
              </p>
            )}

            {/* Total */}
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total</span>
              <span style={styles.totalValue}>
                {formatCurrency(cart.totalPrice || 0)}
              </span>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => navigate('/checkout')}
              style={styles.checkoutBtn}
            >
              Proceed to Checkout →
            </button>

            {/* Trust badges */}
            <div style={styles.trustBadges}>
              <span>🔒 Secure checkout</span>
              <span>↩️ 30-day returns</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── CartItem sub-component ────────────────────────────────────────────────────
// Extracted to keep the main component clean.
// Handles quantity update and remove for ONE cart item.
const CartItem = ({ item, onUpdateQty, onRemove }) => {
  // product may be a populated object or just an id string
  // (depending on whether the cart was populated)
  const productId = item.product?._id || item.product;
  const maxQty    = item.product?.stock || 99;

  return (
    <div style={styles.itemRow}>
      {/* Product image + name */}
      <div style={{ flex: 3, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to={`/products/${productId}`}>
          <img
            src={item.image}
            alt={item.name}
            style={styles.itemImage}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/80'; }}
          />
        </Link>
        <div>
          <Link
            to={`/products/${productId}`}
            style={styles.itemName}
          >
            {item.name}
          </Link>
          <p style={styles.itemPrice}>
            {formatCurrency(item.price)} each
          </p>
        </div>
      </div>

      {/* Quantity controls */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={styles.qtyControls}>
          <button
            onClick={() => onUpdateQty(productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            style={{
              ...styles.qtyBtn,
              opacity: item.quantity <= 1 ? 0.4 : 1,
            }}
          >
            −
          </button>
          <span style={styles.qtyNum}>{item.quantity}</span>
          <button
            onClick={() => onUpdateQty(productId, item.quantity + 1)}
            disabled={item.quantity >= maxQty}
            style={{
              ...styles.qtyBtn,
              opacity: item.quantity >= maxQty ? 0.4 : 1,
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Line total */}
      <div style={{ flex: 1, textAlign: 'right' }}>
        <span style={styles.lineTotal}>
          {formatCurrency(item.price * item.quantity)}
        </span>
      </div>

      {/* Remove button */}
      <div style={{ flex: 0.5, textAlign: 'center' }}>
        <button
          onClick={() => onRemove(productId)}
          style={styles.removeBtn}
          title="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ── SummaryRow sub-component ──────────────────────────────────────────────────
const SummaryRow = ({ label, value, valueStyle = {} }) => (
  <div style={styles.summaryRow}>
    <span style={styles.summaryLabel}>{label}</span>
    <span style={{ ...styles.summaryValue, ...valueStyle }}>{value}</span>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  pageTitle:    { fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  itemCount:    { fontSize: '1rem', fontWeight: 400, color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '0.2rem 0.75rem', borderRadius: '999px' },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' },
  itemsCol:     { display: 'flex', flexDirection: 'column', gap: '0' },
  tableHeader:  { display: 'flex', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' },
  itemRow:      { display: 'flex', alignItems: 'center', padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff', gap: '0.5rem' },
  itemImage:    { width: '72px', height: '72px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#f8fafc', padding: '4px' },
  itemName:     { fontWeight: 600, fontSize: '0.95rem', color: '#0f172a', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' },
  itemPrice:    { fontSize: '0.82rem', color: '#94a3b8' },
  qtyControls:  { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  qtyBtn:       { padding: '0.35rem 0.7rem', border: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, color: '#374151' },
  qtyNum:       { padding: '0.35rem 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', minWidth: '2rem', textAlign: 'center' },
  lineTotal:    { fontWeight: 700, fontSize: '1rem', color: '#0f172a' },
  removeBtn:    { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem', borderRadius: '4px' },
  continueLink: { color: '#3b82f6', fontSize: '0.9rem', padding: '1rem 1rem 0', display: 'inline-block' },
  summaryCol:   { position: 'sticky', top: '80px' },
  summaryCard:  { backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  summaryTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' },
  summaryRows:  { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' },
  summaryRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#64748b', fontSize: '0.9rem' },
  summaryValue: { fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' },
  shippingNote: { backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.8rem', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem' },
  totalRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem', marginBottom: '1.25rem' },
  totalLabel:   { fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' },
  totalValue:   { fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' },
  checkoutBtn:  { width: '100%', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' },
  trustBadges:  { display: 'flex', justifyContent: 'space-around', fontSize: '0.78rem', color: '#94a3b8' },
  emptyState:   { textAlign: 'center', padding: '5rem 2rem', maxWidth: '400px', margin: '0 auto' },
  emptyTitle:   { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '1rem 0 0.5rem' },
  emptyText:    { color: '#64748b', marginBottom: '1.5rem' },
  shopBtn:      { display: 'inline-block', backgroundColor: '#3b82f6', color: '#fff', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem' },
};

export default CartPage;