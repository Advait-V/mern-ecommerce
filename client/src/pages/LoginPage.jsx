// src/pages/LoginPage.jsx
// Controlled form pattern:
//   Each input's value is bound to state (formData)
//   Every keystroke calls onChange → updates state → React re-renders
//   On submit, we call the API with the current state values
//
// This is the standard React way to handle forms.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { useAuth }   from '../context/AuthContext';
import useTitle      from '../hooks/useTitle';

const LoginPage = () => {
  useTitle('Login'); // sets browser tab title

  // ── State ──────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    email:    '',
    password: '',
  });
  const [error,   setError]   = useState('');    // error message to display
  const [loading, setLoading] = useState(false); // true while API call is in flight

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { login }    = useAuth();     // from AuthContext — saves user + token
  const navigate     = useNavigate(); // programmatic navigation
  const location     = useLocation(); // to know where user came from

  // After login, go back to where they were trying to go,
  // or fall back to the home page
  const redirectTo = location.state?.from?.pathname || '/';

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Single onChange handler for ALL inputs
  // e.target.name must match the key in formData
  // This is the DRY way — one handler instead of one per field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts correcting their input
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent default browser form submission (page reload)

    // ── Client-side validation ─────────────────────────────────────────────
    // Catch obvious errors before sending to the server
    if (!formData.email || !formData.password) {
      return setError('Please fill in all fields');
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return setError('Please enter a valid email address');
    }

    try {
      setLoading(true);
      setError('');

      // Call the API — this hits POST /api/auth/login
      const data = await loginUser(formData);
      // data = { success: true, token: '...', user: { _id, name, email, role } }

      // Save token + user to localStorage and AuthContext
      login(data.user, data.token);

      // Redirect to the intended page (or home)
      navigate(redirectTo, { replace: true });

    } catch (err) {
      // err.response.data.message comes from our Express error responses
      // Fallback message if the backend didn't send one
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      // Always runs — re-enable the button whether success or failure
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Email field */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"           // must match formData key
              value={formData.email} // controlled: value comes from state
              onChange={handleChange}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
              disabled={loading}     // disable while submitting
            />
          </div>

          {/* Password field */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={styles.input}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor:  loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer link */}
        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.footerLink}>
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
// Inline styles keep this file self-contained for learning purposes.
// In production you'd use Tailwind classes or CSS modules.
const styles = {
  pageWrapper: {
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding:        '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    '16px',
    padding:         '2.5rem',
    width:           '100%',
    maxWidth:        '420px',
    boxShadow:       '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign:     'center',
    marginBottom:  '1.75rem',
  },
  title: {
    fontSize:    '1.75rem',
    fontWeight:  700,
    color:       '#0f172a',
    marginBottom:'0.25rem',
  },
  subtitle: {
    color:    '#64748b',
    fontSize: '0.95rem',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    color:           '#b91c1c',
    borderRadius:    '8px',
    padding:         '0.75rem 1rem',
    marginBottom:    '1.25rem',
    fontSize:        '0.9rem',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '1.25rem',
  },
  fieldGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.4rem',
  },
  label: {
    fontSize:   '0.875rem',
    fontWeight: 600,
    color:      '#374151',
  },
  input: {
    padding:      '0.65rem 0.9rem',
    border:       '1.5px solid #e2e8f0',
    borderRadius: '8px',
    fontSize:     '0.95rem',
    outline:      'none',
    transition:   'border-color 0.2s',
    color:        '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    color:           '#fff',
    border:          'none',
    borderRadius:    '8px',
    padding:         '0.75rem',
    fontSize:        '1rem',
    fontWeight:      600,
    marginTop:       '0.5rem',
    transition:      'background-color 0.2s',
  },
  footerText: {
    textAlign:  'center',
    marginTop:  '1.5rem',
    fontSize:   '0.9rem',
    color:      '#64748b',
  },
  footerLink: {
    color:      '#3b82f6',
    fontWeight: 600,
  },
};

export default LoginPage;