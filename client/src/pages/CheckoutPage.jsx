// src/pages/CheckoutPage.jsx
//
// Two-column layout:
//   Left  → shipping address form + payment method selector
//   Right → order summary (read-only, same totals as cart)
//
// On submit: calls placeOrder API → clears cart → redirects to order detail

import { useState }           from 'react';
import { useNavigate }        from 'react-router-dom';
import { placeOrder }         from '../api/orderApi';
import { useCart }            from '../context/CartContext';
import { useAuth }            from '../context/AuthContext';
import { formatCurrency }     from '../utils/formatCurrency';
import useTitle               from '../hooks/useTitle';
import Message                from '../components/ui/Message';

// ── Initial address state ─────────────────────────────────────────────────────
// Pre-fill with empty strings — each field maps to the shippingAddress schema
const EMPTY_ADDRESS = {
  fullName:   '',
  address:    '',
  city:       '',
  postalCode: '',
  country:    'India',
  phone:      '',
};

const CheckoutPage = () => {
  useTitle('Checkout');

  const navigate         = useNavigate();
  const { cart, clearCart } = useCart();
  const { user }         = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [shippingAddress, setShippingAddress] = useState({
    ...EMPTY_ADDRESS,
    // Pre-fill name from logged-in user for convenience
    fullName: user?.name || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [errors,        setErrors]        = useState({});
  const [loading,       setLoading]       = useState(false);
  const [serverError,   setServerError]   = useState('');

  // ── Field change handler ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!shippingAddress.fullName.trim())   errs.fullName   = 'Full name is required';
    if (!shippingAddress.address.trim())    errs.address    = 'Address is required';
    if (!shippingAddress.city.trim())       errs.city       = 'City is required';
    if (!shippingAddress.postalCode.trim()) errs.postalCode = 'Postal code is required';
    if (!shippingAddress.country.trim())    errs.country    = 'Country is required';
    if (!shippingAddress.phone.trim())      errs.phone      = 'Phone number is required';
    else if (!/^\d{10}$/.test(shippingAddress.phone.trim()))
      errs.phone = 'Enter a valid 10-digit phone number';
    return errs;
  };

  // ── Submit: place the order ────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to top so user sees the errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);
      setServerError('');

      
      // placeOrder returns { success, order }
      // The backend already cleared the cart — we sync local state too
      // In CheckoutPage.jsx — update the handlePlaceOrder success block
      const data = await placeOrder({ shippingAddress, paymentMethod });
      await clearCart();

      if (paymentMethod === 'stripe') {
        // Stripe orders → go to payment page to complete card payment
        navigate(`/payment/${data.order._id}`);
      } else {
        // COD orders → go straight to order confirmation
        navigate(`/orders/${data.order._id}`, {
          state: { fromCheckout: true },
        });
      }

    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to place order. Please try again.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Guard: redirect to cart if cart is empty
  if (!cart?.items?.length) {
    return (
      <div className="page">
        <Message type="info">
          Your cart is empty.{' '}
          <a href="/products" style={{ color: '#3b82f6' }}>Shop now</a>
        </Message>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <h1 style={styles.pageTitle}>Checkout</h1>

      {serverError && <Message type="error">{serverError}</Message>}

      <div style={styles.layout}>

        {/* ── Left: Shipping form ──────────────────────────────────────── */}
        <div style={styles.formCol}>

          {/* Section 1: Shipping Address */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.stepBadge}>1</span>
              Shipping Address
            </h2>

            <div style={styles.formGrid}>
              <FormField
                label="Full Name"
                name="fullName"
                value={shippingAddress.fullName}
                onChange={handleChange}
                error={errors.fullName}
                placeholder="John Doe"
                span={2}
              />
              <FormField
                label="Street Address"
                name="address"
                value={shippingAddress.address}
                onChange={handleChange}
                error={errors.address}
                placeholder="123 Main Street, Apartment 4B"
                span={2}
              />
              <FormField
                label="City"
                name="city"
                value={shippingAddress.city}
                onChange={handleChange}
                error={errors.city}
                placeholder="Mumbai"
              />
              <FormField
                label="Postal Code"
                name="postalCode"
                value={shippingAddress.postalCode}
                onChange={handleChange}
                error={errors.postalCode}
                placeholder="400001"
              />
              <FormField
                label="Country"
                name="country"
                value={shippingAddress.country}
                onChange={handleChange}
                error={errors.country}
                placeholder="India"
              />
              <FormField
                label="Phone Number"
                name="phone"
                value={shippingAddress.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="9876543210"
                type="tel"
              />
            </div>
          </section>

          {/* Section 2: Payment Method */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.stepBadge}>2</span>
              Payment Method
            </h2>

            <div style={styles.paymentOptions}>
              {/* COD option */}
              <PaymentOption
                id="COD"
                value="COD"
                selected={paymentMethod === 'COD'}
                onSelect={setPaymentMethod}
                icon="💵"
                label="Cash on Delivery"
                desc="Pay when your order arrives"
              />
              {/* Stripe option */}
              <PaymentOption
                id="stripe"
                value="stripe"
                selected={paymentMethod === 'stripe'}
                onSelect={setPaymentMethod}
                icon="💳"
                label="Credit / Debit Card"
                desc="Powered by Stripe — secure online payment"
              />
            </div>

            {/* Stripe notice — we'll wire this up in Step 11 */}
            {paymentMethod === 'stripe' && (
              <div style={styles.stripeNotice}>
                💡 You'll be directed to complete payment on the order
                confirmation page. (Stripe integration — Step 11)
              </div>
            )}
          </section>

        </div>

        {/* ── Right: Order summary ─────────────────────────────────────── */}
        <div style={styles.summaryCol}>
          <div style={styles.summaryCard}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.stepBadge}>3</span>
              Review Order
            </h2>

            {/* Items list */}
            <div style={styles.summaryItems}>
              {cart.items.map((item) => {
                const pid = item.product?._id || item.product;
                return (
                  <div key={pid} style={styles.summaryItem}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={styles.summaryItemImg}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/48'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={styles.summaryItemName}>{item.name}</p>
                      <p style={styles.summaryItemQty}>Qty: {item.quantity}</p>
                    </div>
                    <span style={styles.summaryItemPrice}>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price breakdown */}
            <div style={styles.priceSummary}>
              <PriceLine label="Subtotal"     value={formatCurrency(cart.itemsPrice    || 0)} />
              <PriceLine
                label="Shipping"
                value={cart.shippingPrice === 0 ? 'FREE' : formatCurrency(cart.shippingPrice)}
                green={cart.shippingPrice === 0}
              />
              <PriceLine label="Tax (GST 18%)" value={formatCurrency(cart.taxPrice || 0)} />
              <div style={styles.grandTotal}>
                <span>Total</span>
                <span>{formatCurrency(cart.totalPrice || 0)}</span>
              </div>
            </div>

            {/* Place order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{
                ...styles.placeOrderBtn,
                opacity: loading ? 0.7 : 1,
                cursor:  loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? '⏳ Placing Order…'
                : paymentMethod === 'COD'
                ? '✓ Place Order (COD)'
                : '✓ Place Order & Pay'}
            </button>

            <p style={styles.terms}>
              By placing your order you agree to our{' '}
              <span style={{ color: '#3b82f6' }}>Terms of Service</span>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Local helper components ───────────────────────────────────────────────────

// Reusable form field with label + input + error
const FormField = ({ label, name, value, onChange, error,
                     placeholder, type = 'text', span = 1 }) => (
  <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
    <label style={fieldStyles.label}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        ...fieldStyles.input,
        borderColor: error ? '#f87171' : '#e2e8f0',
      }}
    />
    {error && <span style={fieldStyles.error}>{error}</span>}
  </div>
);

const fieldStyles = {
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', color: '#0f172a', boxSizing: 'border-box' },
  error: { color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' },
};

// Payment method radio card
const PaymentOption = ({ id, value, selected, onSelect, icon, label, desc }) => (
  <label
    htmlFor={id}
    style={{
      ...styles.paymentCard,
      borderColor:     selected ? '#3b82f6' : '#e2e8f0',
      backgroundColor: selected ? '#eff6ff' : '#fff',
      cursor: 'pointer',
    }}
  >
    <input
      type="radio" id={id} name="payment"
      value={value} checked={selected}
      onChange={() => onSelect(value)}
      style={{ display: 'none' }} // hide default radio; card styling shows selection
    />
    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{label}</p>
      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</p>
    </div>
    {selected && <span style={{ color: '#3b82f6', fontWeight: 700 }}>✓</span>}
  </label>
);

// Price line in summary
const PriceLine = ({ label, value, green = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.6rem' }}>
    <span style={{ color: '#64748b' }}>{label}</span>
    <span style={{ fontWeight: 600, color: green ? '#16a34a' : '#0f172a' }}>{value}</span>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  pageTitle:    { fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' },
  formCol:      { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  section:      { backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadge:    { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  paymentOptions: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  paymentCard:  { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '2px solid', borderRadius: '10px', transition: 'all 0.15s' },
  stripeNotice: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginTop: '0.75rem' },
  summaryCol:   { position: 'sticky', top: '80px' },
  summaryCard:  { backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  summaryItems: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '240px', overflowY: 'auto' },
  summaryItem:  { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  summaryItemImg: { width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', backgroundColor: '#f8fafc', flexShrink: 0 },
  summaryItemName: { fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  summaryItemQty:  { fontSize: '0.78rem', color: '#94a3b8' },
  summaryItemPrice: { fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', flexShrink: 0 },
  priceSummary: { borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem', marginBottom: '1.25rem' },
  grandTotal:   { display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', borderTop: '2px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem' },
  placeOrderBtn:{ width: '100%', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' },
  terms:        { fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' },
};

export default CheckoutPage;