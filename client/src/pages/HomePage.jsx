// src/pages/HomePage.jsx

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useTitle from '../hooks/useTitle';

const HomePage = () => {
  useTitle('Home');
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            {isAuthenticated
              ? `Welcome back, ${user?.name?.split(' ')[0]}! 👋`
              : 'Shop the Latest Products'}
          </h1>
          <p style={styles.heroSubtitle}>
            Discover amazing deals on electronics, clothing, books and more.
            Fast delivery, easy returns.
          </p>
          <div style={styles.heroButtons}>
            <Link to="/products" style={styles.btnPrimary}>
              Browse Products →
            </Link>
            {!isAuthenticated && (
              <Link to="/register" style={styles.btnSecondary}>
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section style={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} style={styles.featureCard}>
            <span style={styles.featureIcon}>{f.icon}</span>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureText}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Categories Section ────────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Shop by Category</h2>
        <div style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              style={{ ...styles.categoryCard, backgroundColor: cat.color }}
            >
              <span style={styles.categoryIcon}>{cat.icon}</span>
              <span style={styles.categoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const FEATURES = [
  { icon: '🚀', title: 'Fast Delivery',    desc: 'Get your orders delivered within 2-5 business days.' },
  { icon: '🔒', title: 'Secure Payments',  desc: 'Your payment info is always encrypted and safe.' },
  { icon: '↩️', title: 'Easy Returns',     desc: '30-day hassle-free return policy on all products.' },
  { icon: '🎧', title: '24/7 Support',     desc: 'Our team is always here to help you.' },
];

const CATEGORIES = [
  { name: 'Electronics', icon: '💻', color: '#dbeafe' },
  { name: 'Clothing',    icon: '👕', color: '#dcfce7' },
  { name: 'Books',       icon: '📚', color: '#fef9c3' },
  { name: 'Home',        icon: '🏠', color: '#fce7f3' },
];

const styles = {
  hero: {
    background:    'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
    padding:       '5rem 2rem',
    textAlign:     'center',
    color:         '#fff',
  },
  heroContent:    { maxWidth: '640px', margin: '0 auto' },
  heroTitle:      { fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 },
  heroSubtitle:   { fontSize: '1.1rem', opacity: 0.85, marginBottom: '2rem', lineHeight: 1.6 },
  heroButtons:    { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary:     { backgroundColor: '#fff', color: '#1e40af', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 700, fontSize: '1rem' },
  btnSecondary:   { backgroundColor: 'transparent', color: '#fff', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', border: '2px solid rgba(255,255,255,0.6)' },
  features:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' },
  featureCard:    { textAlign: 'center', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  featureIcon:    { fontSize: '2rem', display: 'block', marginBottom: '0.75rem' },
  featureTitle:   { fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem', color: '#0f172a' },
  featureText:    { fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 },
  section:        { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  sectionTitle:   { fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' },
  categoryGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' },
  categoryCard:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', borderRadius: '12px', textDecoration: 'none', transition: 'transform 0.2s', color: '#1e293b' },
  categoryIcon:   { fontSize: '2rem', marginBottom: '0.5rem' },
  categoryName:   { fontWeight: 600, fontSize: '0.95rem' },
};

export default HomePage;