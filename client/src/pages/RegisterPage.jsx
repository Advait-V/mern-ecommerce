// src/pages/RegisterPage.jsx
// Very similar to LoginPage but with extra fields and validation

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import { useAuth }       from '../context/AuthContext';
import useTitle          from '../hooks/useTitle';

const RegisterPage = () => {
  useTitle('Create Account');

  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [errors,  setErrors]  = useState({});  // field-level errors object
  const [loading, setLoading] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the specific field's error when user edits it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  // Returns an errors object — empty object means everything is valid
  // Field-level errors are more user-friendly than a single global message
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validation — if any errors, show them and stop
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      return setErrors(validationErrors);
    }

    try {
      setLoading(true);

      // Only send name, email, password — NOT confirmPassword
      // The backend doesn't need or want that field
      const data = await registerUser({
        name:     formData.name.trim(),
        email:    formData.email,
        password: formData.password,
      });

      // Same as login — save user and token, then redirect
      login(data.user, data.token);
      navigate('/');

    } catch (err) {
      // Handle server-side errors (e.g. email already exists)
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>

        <div style={styles.header}>
          <h1 style={styles.title}>Create an account</h1>
          <p style={styles.subtitle}>Start shopping today</p>
        </div>

        {/* General error (e.g. email already exists from server) */}
        {errors.general && (
          <div style={styles.errorBox}>⚠️ {errors.general}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Name */}
          <FormField
            id="name"
            label="Full name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={errors.name}
            disabled={loading}
            autoComplete="name"
          />

          {/* Email */}
          <FormField
            id="email"
            label="Email address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            disabled={loading}
            autoComplete="email"
          />

          {/* Password */}
          <FormField
            id="password"
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 6 characters"
            error={errors.password}
            disabled={loading}
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            disabled={loading}
            autoComplete="new-password"
          />

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor:  loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

        </form>

        <p style={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.footerLink}>Sign in</Link>
        </p>

      </div>
    </div>
  );
};

// ── Reusable FormField component (local to this file) ─────────────────────────
// Extracted to avoid repeating the label + input + error pattern 4 times
// It's defined here (not in /components) because only this page uses it
const FormField = ({
  id, label, type, name, value,
  onChange, placeholder, error, disabled, autoComplete
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label htmlFor={id} style={styles.label}>{label}</label>
    <input
      id={id}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      style={{
        ...styles.input,
        borderColor: error ? '#f87171' : '#e2e8f0',
      }}
    />
    {/* Show field-specific error below the input */}
    {error && (
      <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>
        {error}
      </span>
    )}
  </div>
);

const styles = {
  pageWrapper: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f1f5f9', padding: '2rem 1rem',
  },
  card: {
    backgroundColor: '#ffffff', borderRadius: '16px',
    padding: '2.5rem', width: '100%', maxWidth: '440px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header:   { textAlign: 'center', marginBottom: '1.75rem' },
  title:    { fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.95rem' },
  errorBox: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', borderRadius: '8px',
    padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem',
  },
  form:      { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  label:     { fontSize: '0.875rem', fontWeight: 600, color: '#374151' },
  input:     {
    padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.95rem',
    outline: 'none', color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#3b82f6', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '0.75rem', fontSize: '1rem',
    fontWeight: 600, marginTop: '0.5rem',
  },
  footerText: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' },
  footerLink: { color: '#3b82f6', fontWeight: 600 },
};

export default RegisterPage;