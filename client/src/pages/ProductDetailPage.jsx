// src/pages/ProductDetailPage.jsx
//
// Shows full product info, add-to-cart controls, and the reviews section.
// useParams() extracts the :id from the URL (/products/64abc123)

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProductById }             from '../api/productApi';
import { addProductReview }             from '../api/productApi';
import { useCart }                      from '../context/CartContext';
import { useAuth }                      from '../context/AuthContext';
import StarRating                       from '../components/features/StarRating';
import Spinner                          from '../components/ui/Spinner';
import Message                          from '../components/ui/Message';
import { formatCurrency }               from '../utils/formatCurrency';
import useTitle                         from '../hooks/useTitle';

const ProductDetailPage = () => {
  const { id }       = useParams();     // :id from /products/:id
  const navigate     = useNavigate();
  const { addToCart }       = useCart();
  const { isAuthenticated } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [qty,      setQty]      = useState(1);     // selected quantity

  // Review form state
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError,   setReviewError]   = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useTitle(product?.name || 'Product');

  // ── Fetch product on mount / when id changes ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchProductById(id);
        setProduct(data.product);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Product not found'
            : 'Failed to load product'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!isAuthenticated) return navigate('/login');
    addToCart(product._id, qty);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) {
      return setReviewError('Please select a star rating');
    }
    if (!reviewComment.trim()) {
      return setReviewError('Please write a comment');
    }

    try {
      setReviewLoading(true);
      setReviewError('');
      await addProductReview(id, {
        rating:  reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSuccess('Review submitted! Thank you.');
      setReviewRating(0);
      setReviewComment('');
      // Re-fetch product to show the new review and updated rating
      const data = await fetchProductById(id);
      setProduct(data.product);
    } catch (err) {
      setReviewError(
        err.response?.data?.message || 'Failed to submit review'
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading) return <Spinner />;
  if (error)   return (
    <div className="page">
      <Message type="error">{error}</Message>
      <Link to="/products" style={{ color: '#3b82f6' }}>← Back to products</Link>
    </div>
  );
  if (!product) return null;

  const isOutOfStock  = product.stock === 0;
  const maxQty        = Math.min(product.stock, 10); // cap at 10

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* Breadcrumb */}
      <nav style={styles.breadcrumb}>
        <Link to="/"        style={styles.breadLink}>Home</Link>
        <span style={styles.breadSep}>/</span>
        <Link to="/products" style={styles.breadLink}>Products</Link>
        <span style={styles.breadSep}>/</span>
        <span style={{ color: '#374151' }}>{product.name}</span>
      </nav>

      {/* ── Product section ─────────────────────────────────────────────── */}
      <div style={styles.productGrid}>

        {/* Left: Product image */}
        <div style={styles.imageSection}>
          <div style={styles.mainImageWrapper}>
            <img
              src={product.image}
              alt={product.name}
              style={styles.mainImage}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500x500?text=No+Image';
              }}
            />
          </div>
        </div>

        {/* Right: Product info */}
        <div style={styles.infoSection}>

          {/* Category + brand row */}
          <div style={styles.badgeRow}>
            <span style={styles.categoryBadge}>{product.category}</span>
            {product.brand && (
              <span style={styles.brandBadge}>{product.brand}</span>
            )}
          </div>

          <h1 style={styles.productName}>{product.name}</h1>

          {/* Rating summary */}
          <div style={styles.ratingRow}>
            <StarRating rating={product.rating} size="1.3rem" />
            <span style={styles.ratingNum}>
              {product.rating?.toFixed(1)}
            </span>
            <span style={styles.reviewCount}>
              ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Price */}
          <div style={styles.priceBlock}>
            <span style={styles.price}>{formatCurrency(product.price)}</span>
          </div>

          {/* Stock status */}
          <div style={styles.stockRow}>
            <span style={{
              ...styles.stockBadge,
              backgroundColor: isOutOfStock ? '#fee2e2' : '#dcfce7',
              color:           isOutOfStock ? '#b91c1c' : '#166534',
            }}>
              {isOutOfStock
                ? '✕ Out of Stock'
                : `✓ In Stock (${product.stock} left)`}
            </span>
          </div>

          {/* Description */}
          <p style={styles.description}>{product.description}</p>

          {/* ── Add to Cart controls ──────────────────────────────────── */}
          {!isOutOfStock && (
            <div style={styles.cartControls}>
              {/* Quantity selector */}
              <div style={styles.qtyWrapper}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={styles.qtyBtn}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span style={styles.qtyDisplay}>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  style={styles.qtyBtn}
                  disabled={qty >= maxQty}
                >
                  +
                </button>
              </div>

              {/* Add to Cart / Login CTA */}
              {isAuthenticated ? (
                <button
                  onClick={handleAddToCart}
                  style={styles.addToCartBtn}
                >
                  🛒 Add to Cart
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  style={{ ...styles.addToCartBtn, backgroundColor: '#64748b' }}
                >
                  Login to Add to Cart
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Reviews Section ──────────────────────────────────────────────── */}
      <section style={styles.reviewsSection}>
        <h2 style={styles.reviewsTitle}>
          Customer Reviews
          {product.numReviews > 0 && (
            <span style={styles.reviewCountBadge}>
              {product.numReviews}
            </span>
          )}
        </h2>

        {/* Review list */}
        {product.reviews && product.reviews.length > 0 ? (
          <div style={styles.reviewList}>
            {product.reviews.map((review, idx) => (
              <div key={idx} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewAvatar}>
                    {review.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.reviewName}>{review.name}</p>
                    <p style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <StarRating rating={review.rating} size="1rem" />
                  </div>
                </div>
                <p style={styles.reviewComment}>{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', padding: '1rem 0' }}>
            No reviews yet. Be the first to review!
          </p>
        )}

        {/* ── Write a review form (logged-in users only) ──────────────── */}
        <div style={styles.writeReview}>
          <h3 style={styles.writeReviewTitle}>Write a Review</h3>

          {!isAuthenticated ? (
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>
                Log in
              </Link>{' '}
              to leave a review.
            </p>
          ) : reviewSuccess ? (
            <Message type="success">{reviewSuccess}</Message>
          ) : (
            <form onSubmit={handleSubmitReview} style={styles.reviewForm}>

              {reviewError && (
                <Message type="error">{reviewError}</Message>
              )}

              {/* Star rating input */}
              <div style={styles.reviewField}>
                <label style={styles.reviewLabel}>Your Rating</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StarRating
                    rating={reviewRating}
                    onRate={setReviewRating} // interactive mode
                    size="1.75rem"
                  />
                  {reviewRating > 0 && (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment textarea */}
              <div style={styles.reviewField}>
                <label style={styles.reviewLabel}>Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Share your honest experience with this product…"
                  style={styles.textarea}
                  disabled={reviewLoading}
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                style={{
                  ...styles.submitReviewBtn,
                  opacity: reviewLoading ? 0.7 : 1,
                  cursor:  reviewLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {reviewLoading ? 'Submitting…' : 'Submit Review'}
              </button>

            </form>
          )}
        </div>

      </section>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  breadcrumb:   { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' },
  breadLink:    { color: '#3b82f6', textDecoration: 'none' },
  breadSep:     { color: '#cbd5e1' },
  productGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', marginBottom: '3rem' },
  imageSection: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  mainImageWrapper: { backgroundColor: '#f8fafc', borderRadius: '16px', overflow: 'hidden', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px' },
  mainImage:    { maxHeight: '360px', objectFit: 'contain', borderRadius: '8px' },
  infoSection:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
  badgeRow:     { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  categoryBadge:{ backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', textTransform: 'uppercase' },
  brandBadge:   { backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px' },
  productName:  { fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 },
  ratingRow:    { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  ratingNum:    { fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' },
  reviewCount:  { fontSize: '0.875rem', color: '#94a3b8' },
  priceBlock:   { padding: '0.75rem 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' },
  price:        { fontSize: '2rem', fontWeight: 800, color: '#0f172a' },
  stockRow:     { display: 'flex' },
  stockBadge:   { padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
  description:  { color: '#475569', lineHeight: 1.7, fontSize: '0.95rem' },
  cartControls: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' },
  qtyWrapper:   { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  qtyBtn:       { padding: '0.6rem 0.9rem', border: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, color: '#374151' },
  qtyDisplay:   { padding: '0.6rem 1rem', fontSize: '1rem', fontWeight: 600, minWidth: '2.5rem', textAlign: 'center', color: '#0f172a' },
  addToCartBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', flex: 1, minWidth: '180px' },
  reviewsSection: { backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  reviewsTitle: { fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  reviewCountBadge: { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '999px' },
  reviewList:   { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' },
  reviewCard:   { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '1.25rem' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  reviewAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  reviewName:   { fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' },
  reviewDate:   { fontSize: '0.78rem', color: '#94a3b8' },
  reviewComment:{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 },
  writeReview:  { borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '1rem' },
  writeReviewTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' },
  reviewForm:   { display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '540px' },
  reviewField:  { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  reviewLabel:  { fontSize: '0.875rem', fontWeight: 600, color: '#374151' },
  textarea:     { padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: '#0f172a' },
  submitReviewBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, width: 'fit-content' },
};

export default ProductDetailPage;