// src/context/AuthContext.jsx
//
// Context solves the "prop drilling" problem.
// Without Context: App → Navbar → UserMenu → Avatar (passing user down 3 levels)
// With Context:    ANY component can read user directly, no passing needed
//
// AuthContext stores: who is logged in, their token, and auth actions
// Any component can call useAuth() to get this data instantly

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyProfile } from '../api/authApi';

// 1. Create the context object (like creating an empty box)
const AuthContext = createContext();

// 2. Create the Provider — this wraps the app and fills the box with data
export const AuthProvider = ({ children }) => {
  // State: current logged-in user object (null if not logged in)
  const [user, setUser]       = useState(null);
  // State: is auth state being loaded (prevents flicker on refresh)
  const [loading, setLoading] = useState(true);

  // ── On app load: restore session from localStorage ──────────────────────
  // When the user refreshes the page, React state resets to null.
  // We persist the token in localStorage so we can restore the session.
  // This effect runs ONCE when the app first mounts.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify the token is still valid by fetching fresh profile
          // This catches expired tokens before the user tries any action
          const data = await getMyProfile();
          setUser(data.user);
        } catch {
          // Token is invalid or expired — clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      setLoading(false); // session restore attempt complete
    };

    restoreSession();
  }, []); // empty dependency array = run once on mount

  // ── login: called after successful /auth/login or /auth/register ─────────
  const login = (userData, token) => {
    // Save to localStorage so the session survives page refresh
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // Update React state so all components re-render with new user
    setUser(userData);
  };

  // ── logout: clears everything ─────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // The Axios response interceptor also calls this path on 401
  };

  // ── Derived values (computed from state, not stored separately) ───────────
  const isAuthenticated = !!user;         // true if user is not null
  const isAdmin         = user?.role === 'admin'; // optional chaining — safe if null

  // 3. Provide all values to children
  // Any component wrapped inside AuthProvider can access these via useAuth()
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {/* Don't render children until session restore is done
          This prevents a flash of "logged out" state on refresh */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook — makes consuming the context clean and readable
// Instead of: const { user } = useContext(AuthContext)   (verbose)
// We write:   const { user } = useAuth()                 (clean)
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Warn if someone uses useAuth() outside of AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};