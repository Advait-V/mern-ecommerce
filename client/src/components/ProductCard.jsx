// src/components/ProductCard.jsx
//
// Reusable card displayed in the product grid.
// Shows: image, name, category, rating, price, stock badge, add-to-cart button
//
// Props:
//   product  — the product object from the API
//   onAddToCart — optional override (defaults to CartContext addToCart)

import { Link }    from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating  from './StarRating';
import { formatCurrency } from '../utils/formatCurrency';

const ProductCard = ({ product }) => {
  const { addToCart }      = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = (e) => {
    // Stop the click from bubbling up to the Link wrapper
    // (otherwise clicking the button would also navigate to product detail)
    e.preventDefault();
    e.stopPropagation();
    addToCart(product._id, 1);
  };

  const isOutOfStock = product.stock === 0;

  return (
    // The entire card is a Link — click anywhere to go to detail page
    <Link to={`/products/${product._id}`} style={styles.cardLink}>
      <div style={styles.card}>

        {/* Product image */}
        <div style={styles.imageWrapper}>
          <img
            src={product.image || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.name}
            style={styles.image}
            // Fallback if image URL is broken
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          {/* Out of stock overlay badge */}
          {isOutOfStock && (
            <div style={styles.outOfStockBadge}>Out of Stock</div>
          )}
        </div>

        {/* Card body */}
        <div style={styles.body}>

          {/* Category pill */}
          <span style={styles.categoryBadge}>{product.category}</span>

          {/* Product name — clamp to 2 lines to keep cards uniform height */}
          <h3 style={styles.name}>{product.name}</h3>

          {/* Rating row */}
          <div style={styles.ratingRow}>
            <StarRating rating={product.rating} size="0.95rem" />
            <span style={styles.reviewCount}>
              ({product.numReviews || 0})
            </span>
          </div>

          {/* Price + Add to cart */}
          <div style={styles.footer}>
            <span style={styles.price}>
              {formatCurrency(product.price)}
            </span>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || !isAuthenticated}
              title={
                !isAuthenticated
                  ? 'Login to add to cart'
                  : isOutOfStock
                  ? 'Out of stock'
                  : 'Add to cart'
              }
              style={{
                ...styles.addBtn,
                opacity:    (isOutOfStock || !isAuthenticated) ? 0.5 : 1,
                cursor:     (isOutOfStock || !isAuthenticated) ? 'not-allowed' : 'pointer',
                backgroundColor: isOutOfStock ? '#94a3b8' : '#3b82f6',
              }}
            >
              {isOutOfStock ? 'Sold out' : '+ Cart'}
            </button>
          </div>

        </div>
      </div>
    </Link>
  );
};

const styles = {
  cardLink: { textDecoration: 'none', color: 'inherit', display: 'block' },
  card: {
    backgroundColor: '#fff',
    borderRadius:    '12px',
    overflow:        'hidden',
    boxShadow:       '0 2px 8px rgba(0,0,0,0.06)',
    transition:      'transform 0.2s, box-shadow 0.2s',
    height:          '100%',
    display:         'flex',
    flexDirection:   'column',
  },
  imageWrapper: {
    position:        'relative',
    paddingTop:      '75%', // 4:3 aspect ratio
    backgroundColor: '#f8fafc',
    overflow:        'hidden',
  },
  image: {
    position:   'absolute',
    top: 0, left: 0,
    width:      '100%',
    height:     '100%',
    objectFit:  'contain',
    padding:    '0.5rem',
    transition: 'transform 0.3s',
  },
  outOfStockBadge: {
    position:        'absolute',
    top:             '0.5rem',
    right:           '0.5rem',
    backgroundColor: '#ef4444',
    color:           '#fff',
    fontSize:        '0.7rem',
    fontWeight:      700,
    padding:         '0.2rem 0.5rem',
    borderRadius:    '4px',
  },
  body: {
    padding:       '1rem',
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.5rem',
    flex:          1,
  },
  categoryBadge: {
    display:         'inline-block',
    backgroundColor: '#eff6ff',
    color:           '#3b82f6',
    fontSize:        '0.7rem',
    fontWeight:      700,
    padding:         '0.2rem 0.6rem',
    borderRadius:    '999px',
    width:           'fit-content',
    textTransform:   'uppercase',
    letterSpacing:   '0.05em',
  },
  name: {
    fontSize:    '0.95rem',
    fontWeight:  600,
    color:       '#0f172a',
    lineHeight:  1.4,
    // Clamp to 2 lines
    display:           '-webkit-box',
    WebkitLineClamp:   2,
    WebkitBoxOrient:   'vertical',
    overflow:          'hidden',
  },
  ratingRow:   { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  reviewCount: { fontSize: '0.8rem', color: '#94a3b8' },
  footer: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      'auto',
    paddingTop:     '0.5rem',
  },
  price: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' },
  addBtn: {
    color:        '#fff',
    border:       'none',
    borderRadius: '6px',
    padding:      '0.4rem 0.8rem',
    fontSize:     '0.82rem',
    fontWeight:   600,
    transition:   'background-color 0.2s',
  },
};

export default ProductCard;