// src/pages/ProductsPage.jsx
//
// URL is the single source of truth for all filter state.
// WHY? Because:
//   1. Filters survive page refresh
//   2. Users can share filtered URLs
//   3. Browser back button works correctly
//   4. No need to sync two sources of state
//
// useSearchParams() reads and writes the URL query string
// Every filter change → update URL → useEffect re-fetches products

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link }             from 'react-router-dom';
import { fetchProducts, fetchCategories }    from '../api/productApi';
import ProductCard from '../components/ProductCard';
import Spinner     from '../components/Spinner';
import Message     from '../components/Message';
import useTitle    from '../hooks/useTitle';

const ProductsPage = () => {
  useTitle('Products');

  // ── URL state (source of truth for filters) ───────────────────────────────
  // searchParams reads the URL; setSearchParams updates it
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current values from URL (with fallback defaults)
  const currentKeyword  = searchParams.get('keyword')  || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSort     = searchParams.get('sort')     || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentPage     = Number(searchParams.get('page')) || 1;

  // ── Local UI state (not in URL — these are ephemeral) ─────────────────────
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Search input has its own local state so typing doesn't immediately
  // trigger API calls on every keystroke — we only commit to URL on submit
  const [searchInput, setSearchInput] = useState(currentKeyword);

  // ── Fetch categories once on mount ────────────────────────────────────────
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data.categories);
      } catch {
        console.error('Failed to load categories');
      }
    };
    loadCategories();
  }, []); // empty array = run once

  // ── Fetch products whenever URL changes ───────────────────────────────────
  // useCallback memoises the function so it doesn't change on every render
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Build params object from current URL values
      // Only include params that have a value (avoid ?keyword=&category=)
      const params = {};
      if (currentKeyword)  params.keyword  = currentKeyword;
      if (currentCategory) params.category = currentCategory;
      if (currentSort)     params.sort     = currentSort;
      if (currentMinPrice) params.minPrice = currentMinPrice;
      if (currentMaxPrice) params.maxPrice = currentMaxPrice;
      params.page  = currentPage;
      params.limit = 8; // 8 products per page

      const data = await fetchProducts(params);
      setProducts(data.products);
      setTotalPages(data.pages);
      setTotalCount(data.total);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentKeyword, currentCategory, currentSort,
      currentMinPrice, currentMaxPrice, currentPage]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]); // runs whenever loadProducts (i.e. URL params) changes

  // ── Filter helpers — update URL params ────────────────────────────────────
  // These functions modify the URL, which triggers loadProducts via the effect

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key); // remove param if empty
    }
    next.set('page', '1'); // always reset to page 1 when filter changes
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('keyword', searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({}); // clear ALL params → back to default
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Are any filters currently active?
  const hasFilters =
    currentKeyword || currentCategory ||
    currentSort    || currentMinPrice || currentMaxPrice;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>All Products</h1>
          {!loading && (
            <p style={styles.resultCount}>
              {totalCount} product{totalCount !== 1 ? 's' : ''} found
              {currentCategory && ` in "${currentCategory}"`}
              {currentKeyword  && ` for "${currentKeyword}"`}
            </p>
          )}
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSearchSubmit} style={styles.searchBar}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products…"
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchBtn}>Search</button>
        {hasFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            style={styles.clearBtn}
          >
            Clear all
          </button>
        )}
      </form>

      {/* ── Main layout: sidebar filters + product grid ─────────────────── */}
      <div style={styles.mainLayout}>

        {/* ── Filter Sidebar ───────────────────────────────────────────── */}
        <aside style={styles.sidebar}>

          {/* Category filter */}
          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Category</h3>
            {/* "All" option */}
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="category"
                checked={currentCategory === ''}
                onChange={() => updateParam('category', '')}
                style={styles.radio}
              />
              All Categories
            </label>
            {categories.map((cat) => (
              <label key={cat} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="category"
                  checked={currentCategory === cat}
                  onChange={() => updateParam('category', cat)}
                  style={styles.radio}
                />
                {cat}
              </label>
            ))}
          </div>

          {/* Price range filter */}
          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Price Range</h3>
            <div style={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min ₹"
                value={currentMinPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                style={styles.priceInput}
                min="0"
              />
              <span style={{ color: '#94a3b8' }}>—</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={currentMaxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                style={styles.priceInput}
                min="0"
              />
            </div>
          </div>

          {/* Sort order */}
          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Sort By</h3>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              style={styles.select}
            >
              <option value="">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Active filters summary */}
          {hasFilters && (
            <div style={styles.activeFilters}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Active filters:
              </p>
              {currentCategory && (
                <FilterTag
                  label={`Category: ${currentCategory}`}
                  onRemove={() => updateParam('category', '')}
                />
              )}
              {currentKeyword && (
                <FilterTag
                  label={`Search: "${currentKeyword}"`}
                  onRemove={() => {
                    setSearchInput('');
                    updateParam('keyword', '');
                  }}
                />
              )}
              {(currentMinPrice || currentMaxPrice) && (
                <FilterTag
                  label={`Price: ₹${currentMinPrice || 0} – ₹${currentMaxPrice || '∞'}`}
                  onRemove={() => {
                    updateParam('minPrice', '');
                    updateParam('maxPrice', '');
                  }}
                />
              )}
            </div>
          )}

        </aside>

        {/* ── Product Grid ─────────────────────────────────────────────── */}
        <div style={styles.gridArea}>

          {error && <Message type="error">{error}</Message>}

          {loading ? (
            // Loading skeleton — shows placeholder cards while fetching
            <div style={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div style={styles.emptyState}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3 style={{ marginTop: '1rem', color: '#0f172a' }}>
                No products found
              </h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                Try adjusting your filters or search term
              </p>
              <button
                onClick={handleClearFilters}
                style={{ ...styles.searchBtn, marginTop: '1rem' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            // Product grid
            <div style={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  style={{
                    ...styles.pageBtn,
                    backgroundColor: p === currentPage ? '#3b82f6'  : '#fff',
                    color:           p === currentPage ? '#fff'      : '#374151',
                    fontWeight:      p === currentPage ? 700         : 400,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage === totalPages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ── Small helper components (local to this file) ──────────────────────────────

// Filter tag shown in sidebar under "Active filters"
const FilterTag = ({ label, onRemove }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#eff6ff', borderRadius: '6px',
    padding: '0.3rem 0.6rem', marginBottom: '0.4rem', fontSize: '0.8rem',
  }}>
    <span style={{ color: '#1e40af' }}>{label}</span>
    <button
      onClick={onRemove}
      style={{ background: 'none', border: 'none', color: '#3b82f6',
               cursor: 'pointer', fontWeight: 700, marginLeft: '0.5rem' }}
    >
      ×
    </button>
  </div>
);

// Skeleton card shown while loading — prevents layout shift
const SkeletonCard = () => (
  <div style={{
    backgroundColor: '#fff', borderRadius: '12px',
    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }}>
    <div style={{ height: '200px', backgroundColor: '#f1f5f9',
                  animation: 'pulse 1.5s ease-in-out infinite' }} />
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px', width: '60%' }} />
      <div style={{ height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
      <div style={{ height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px', width: '40%' }} />
    </div>
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  pageHeader:   { marginBottom: '1.5rem' },
  pageTitle:    { fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' },
  resultCount:  { color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' },
  searchBar: {
    display: 'flex', gap: '0.75rem', marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1, minWidth: '200px', padding: '0.65rem 1rem',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '0.95rem', outline: 'none',
  },
  searchBtn: {
    backgroundColor: '#3b82f6', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '0.65rem 1.25rem',
    fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
  },
  clearBtn: {
    backgroundColor: '#f1f5f9', color: '#374151', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', padding: '0.65rem 1.25rem',
    fontSize: '0.95rem', cursor: 'pointer',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: '1.5rem',
    alignItems: 'start',
    // On small screens, stack vertically
    '@media (max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
  sidebar: {
    backgroundColor: '#fff', borderRadius: '12px',
    padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    position: 'sticky', top: '80px', // sticks below navbar
  },
  filterSection: { marginBottom: '1.5rem' },
  filterTitle: {
    fontSize: '0.85rem', fontWeight: 700, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  radioLabel: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem',
    cursor: 'pointer',
  },
  radio:         { accentColor: '#3b82f6', cursor: 'pointer' },
  priceInputs:   { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  priceInput: {
    width: '80px', padding: '0.5rem', border: '1.5px solid #e2e8f0',
    borderRadius: '6px', fontSize: '0.85rem', outline: 'none',
  },
  select: {
    width: '100%', padding: '0.5rem', border: '1.5px solid #e2e8f0',
    borderRadius: '6px', fontSize: '0.875rem', outline: 'none',
    backgroundColor: '#fff', cursor: 'pointer',
  },
  activeFilters: {
    backgroundColor: '#f8fafc', borderRadius: '8px',
    padding: '0.75rem', marginTop: '0.5rem',
  },
  gridArea: { minWidth: 0 }, // prevents grid blowout
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  emptyState: {
    textAlign: 'center', padding: '4rem 2rem',
    backgroundColor: '#fff', borderRadius: '12px',
  },
  pagination: {
    display: 'flex', justifyContent: 'center',
    gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '0.5rem 0.9rem', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer',
    backgroundColor: '#fff', transition: 'all 0.15s',
  },
};

export default ProductsPage;