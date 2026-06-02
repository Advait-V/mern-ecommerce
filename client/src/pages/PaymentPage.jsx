// src/pages/PaymentPage.jsx
//
// This page is shown when a user chose "Stripe" at checkout
// and needs to complete the payment for an existing order.
//
// Flow:
//   1. Page loads → fetches order → calls createPaymentIntent
//   2. Stripe Elements renders a secure card input form
//   3. User enters card → clicks Pay → stripe.confirmPayment()
//   4. On success → call PUT /orders/:id/pay → redirect to order detail
//
// @stripe/react-stripe-js provides:
//   <Elements>          — context provider (like React Context)
//   <PaymentElement>    — Stripe's hosted card UI (PCI compliant)
//   useStripe()         — access the stripe instance
//   useElements()       — access the Elements instance

import { useState, useEffect }             from 'react';
import { useParams, useNavigate }          from 'react-router-dom';
import { loadStripe }                      from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
}                                          from '@stripe/react-stripe-js';
import { createPaymentIntent }             from '../api/paymentApi';
import { payOrder, fetchOrderById }        from '../api/orderApi';
import Spinner                             from '../components/ui/Spinner';
import Message                             from '../components/ui/Message';
import { formatCurrency }                  from '../utils/formatCurrency';
import useTitle                            from '../hooks/useTitle';

// Load Stripe OUTSIDE of the component to avoid recreating on every render
// loadStripe is async — it loads the Stripe.js script from Stripe's CDN
// The publishable key is safe to expose (it's not a secret)
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

// ── Outer component: fetches order + creates PaymentIntent ─────────────────
const PaymentPage = () => {
  useTitle('Complete Payment');

  const { id }       = useParams(); // order ID from /payment/:id
  const navigate     = useNavigate();

  const [order,        setOrder]        = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const setup = async () => {
      try {
        // Step 1: Fetch the order to show the summary
        const orderData = await fetchOrderById(id);
        const fetchedOrder = orderData.order;

        // If already paid, skip payment and go to order detail
        if (fetchedOrder.isPaid) {
          navigate(`/orders/${id}`, { replace: true });
          return;
        }

        // If payment method is COD, no payment needed
        if (fetchedOrder.paymentMethod === 'COD') {
          navigate(`/orders/${id}`, { replace: true });
          return;
        }

        setOrder(fetchedOrder);

        // Step 2: Create a PaymentIntent on your backend
        // This gives us the clientSecret Stripe.js needs
        const paymentData = await createPaymentIntent(id);
        setClientSecret(paymentData.clientSecret);

      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to initialize payment'
        );
      } finally {
        setLoading(false);
      }
    };

    setup();
  }, [id, navigate]);

  if (loading) return <Spinner />;
  if (error)   return (
    <div className="page">
      <Message type="error">{error}</Message>
    </div>
  );

  // Stripe Elements appearance config — matches our app's design
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary:       '#3b82f6',
      colorBackground:    '#ffffff',
      colorText:          '#0f172a',
      colorDanger:        '#ef4444',
      fontFamily:         '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      borderRadius:       '8px',
    },
  };

  return (
    <div className="page">
      <div style={styles.pageWrapper}>

        {/* Left: Payment form */}
        <div style={styles.paymentCol}>
          <h1 style={styles.pageTitle}>Complete Payment</h1>

          {/* Order summary card */}
          {order && (
            <div style={styles.orderSummaryCard}>
              <div style={styles.orderSummaryRow}>
                <span style={styles.orderSummaryLabel}>
                  Order #{order._id.slice(-8).toUpperCase()}
                </span>
                <span style={styles.orderSummaryAmount}>
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>
              <p style={styles.orderSummaryItems}>
                {order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Stripe Elements wrapper
              Elements MUST wrap the component using useStripe/useElements
              clientSecret tells Stripe which PaymentIntent this form is for */}
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance }}
            >
              {/* The actual payment form — defined below */}
              <CheckoutForm orderId={id} orderTotal={order?.totalPrice} />
            </Elements>
          )}
        </div>

        {/* Right: Trust signals */}
        <div style={styles.trustCol}>
          <div style={styles.trustCard}>
            <h3 style={styles.trustTitle}>🔒 Secure Payment</h3>
            <p style={styles.trustText}>
              Your payment is processed by Stripe — a PCI-DSS Level 1 certified
              payment processor. Your card details never touch our servers.
            </p>

            <div style={styles.trustItems}>
              {[
                { icon: '🛡️', text: '256-bit SSL encryption' },
                { icon: '✅', text: 'PCI DSS compliant' },
                { icon: '🔄', text: '30-day return policy' },
                { icon: '📞', text: '24/7 customer support' },
              ].map((item) => (
                <div key={item.text} style={styles.trustItem}>
                  <span>{item.icon}</span>
                  <span style={styles.trustItemText}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Test card hint — remove in production */}
            <div style={styles.testCardBox}>
              <p style={styles.testCardTitle}>🧪 Test Card Details</p>
              <p style={styles.testCardText}>Card: 4242 4242 4242 4242</p>
              <p style={styles.testCardText}>Expiry: Any future date</p>
              <p style={styles.testCardText}>CVC: Any 3 digits</p>
              <p style={styles.testCardText}>ZIP: Any 5 digits</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Inner component: the actual Stripe payment form ─────────────────────────
// Must be a CHILD of <Elements> to use useStripe() and useElements()
const CheckoutForm = ({ orderId, orderTotal }) => {
  const stripe   = useStripe();   // Stripe.js instance
  const elements = useElements(); // access to PaymentElement

  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [payError,   setPayError]   = useState('');
  const [succeeded,  setSucceeded]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // stripe and elements are null until Stripe.js fully loads
    if (!stripe || !elements) return;

    try {
      setProcessing(true);
      setPayError('');

      // Step 1: Confirm the payment with Stripe
      // This sends the card details DIRECTLY to Stripe (not to our server)
      // confirmPayment uses the clientSecret (already in Elements context)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        // redirect: 'if_required' means only redirect for methods that need it
        // (like bank redirects). Cards complete inline.
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show Stripe's error message (e.g. "Your card was declined")
        setPayError(error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSucceeded(true);

        // Step 2: Tell our backend the payment succeeded
        // The webhook does this automatically too, but calling it here
        // gives immediate feedback without waiting for the webhook
        try {
          await payOrder(orderId, {
            paymentIntentId: paymentIntent.id,
            paymentStatus:   paymentIntent.status,
            payerEmail:      paymentIntent.receipt_email || '',
          });
        } catch (err) {
          // Even if this fails, the webhook will catch it
          // Log but don't block the user
          console.warn('payOrder call failed (webhook will handle it):', err);
        }

        // Step 3: Redirect to order detail with success state
        setTimeout(() => {
          navigate(`/orders/${orderId}`, {
            state: { fromPayment: true },
          });
        }, 1500); // short delay so user sees the success message
      }

    } catch (err) {
      setPayError('An unexpected error occurred. Please try again.');
      setProcessing(false);
    }
  };

  // Success state — shown briefly before redirect
  if (succeeded) {
    return (
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✅</div>
        <h2 style={styles.successTitle}>Payment Successful!</h2>
        <p style={styles.successText}>
          {formatCurrency(orderTotal)} — Redirecting to your order…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.stripeForm}>

      {/* Stripe's hosted PaymentElement — renders card fields securely */}
      {/* This element is served from Stripe's CDN, not your domain */}
      <div style={styles.paymentElementWrapper}>
        <PaymentElement
          options={{
            layout: 'tabs', // shows card, wallet tabs if available
          }}
        />
      </div>

      {/* Error message from Stripe */}
      {payError && (
        <div style={styles.stripeError}>
          ⚠️ {payError}
        </div>
      )}

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...styles.payBtn,
          opacity: (!stripe || processing) ? 0.7 : 1,
          cursor:  (!stripe || processing) ? 'not-allowed' : 'pointer',
        }}
      >
        {processing
          ? '⏳ Processing…'
          : `Pay ${formatCurrency(orderTotal || 0)}`}
      </button>

      <p style={styles.secureNote}>
        🔒 Payments are secured by Stripe
      </p>
    </form>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  pageWrapper:     { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' },
  paymentCol:      { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  pageTitle:       { fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' },
  orderSummaryCard:{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem' },
  orderSummaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderSummaryLabel: { fontWeight: 700, color: '#1e40af', fontSize: '0.95rem' },
  orderSummaryAmount: { fontSize: '1.4rem', fontWeight: 800, color: '#1e40af' },
  orderSummaryItems: { color: '#3b82f6', fontSize: '0.85rem', marginTop: '0.25rem' },
  stripeForm:      { backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  paymentElementWrapper: { minHeight: '200px' },
  stripeError:     { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem' },
  payBtn:          { backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 700 },
  secureNote:      { textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' },
  successBox:      { backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center' },
  successIcon:     { fontSize: '3rem', marginBottom: '1rem' },
  successTitle:    { fontSize: '1.5rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' },
  successText:     { color: '#166534', fontSize: '0.95rem' },
  trustCol:        { position: 'sticky', top: '80px' },
  trustCard:       { backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  trustTitle:      { fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
  trustText:       { color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 },
  trustItems:      { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  trustItem:       { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  trustItemText:   { fontSize: '0.85rem', color: '#374151' },
  testCardBox:     { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem' },
  testCardTitle:   { fontWeight: 700, color: '#92400e', fontSize: '0.85rem', marginBottom: '0.5rem' },
  testCardText:    { fontSize: '0.82rem', color: '#78350f', fontFamily: 'monospace', lineHeight: 1.8 },
};

export default PaymentPage;