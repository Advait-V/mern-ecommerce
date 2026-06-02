// src/pages/ProfilePage.jsx
// Lets a logged-in user update their name and change their password
// Demonstrates two separate forms on one page with independent state

import { useState } from 'react';
import { updateProfile, updatePassword } from '../api/authApi';
import { useAuth }                        from '../context/AuthContext';
import { toast }                          from 'react-toastify';
import useTitle                           from '../hooks/useTitle';

const ProfilePage = () => {
  useTitle('My Profile');

  const { user, login } = useAuth();

  // ── Form 1: Profile info ───────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Form 2: Password change ────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError,   setPasswordError]   = useState('');

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleProfileChange = (e) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (passwordError) setPasswordError('');
  };

  // Submit: update name
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      return toast.error('Name cannot be empty');
    }
    try {
      setProfileLoading(true);
      const data = await updateProfile(profileData);
      // Update the user in AuthContext so Navbar reflects new name immediately
      login(data.user, localStorage.getItem('token'));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit: change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      return setPasswordError('New password must be at least 6 characters');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordError('New passwords do not match');
    }

    try {
      setPasswordLoading(true);
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword:     passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      // Clear the form after success
      setPasswordData({
        currentPassword: '', newPassword: '', confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Password change failed'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <h1 style={styles.pageTitle}>My Profile</h1>

      <div style={styles.grid}>

        {/* ── Card 1: Profile Info ──────────────────────────────────────── */}
        <div style={styles.card}>
          {/* Avatar circle with initials */}
          <div style={styles.avatarCircle}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <h2 style={styles.cardTitle}>Account Information</h2>

          <form onSubmit={handleProfileSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                style={styles.input}
                disabled={profileLoading}
              />
            </div>

            {/* Email is read-only — changing email requires extra
                security steps (verification email) which is out of scope */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={user?.email || ''}
                style={{ ...styles.input, backgroundColor: '#f8fafc', color: '#94a3b8' }}
                readOnly
              />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Email cannot be changed
              </span>
            </div>

            {/* Role badge */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Role</label>
              <span style={{
                display: 'inline-block',
                padding: '0.3rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: user?.role === 'admin' ? '#fef3c7' : '#dbeafe',
                color: user?.role === 'admin' ? '#92400e' : '#1e40af',
                width: 'fit-content',
              }}>
                {user?.role?.toUpperCase()}
              </span>
            </div>

            <button
              type="submit"
              style={{
                ...styles.btn,
                opacity: profileLoading ? 0.7 : 1,
                cursor: profileLoading ? 'not-allowed' : 'pointer',
              }}
              disabled={profileLoading}
            >
              {profileLoading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* ── Card 2: Change Password ───────────────────────────────────── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Change Password</h2>

          {passwordError && (
            <div style={styles.errorBox}>⚠️ {passwordError}</div>
          )}

          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Current password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                style={styles.input}
                placeholder="Enter current password"
                disabled={passwordLoading}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>New password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                style={styles.input}
                placeholder="Min. 6 characters"
                disabled={passwordLoading}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm new password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                style={styles.input}
                placeholder="Re-enter new password"
                disabled={passwordLoading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.btn,
                backgroundColor: '#0f172a',
                opacity: passwordLoading ? 0.7 : 1,
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
              }}
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

const styles = {
  pageTitle:   { fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', color: '#0f172a' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  card:        { backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  avatarCircle:{
    width: '64px', height: '64px', borderRadius: '50%',
    backgroundColor: '#3b82f6', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem',
  },
  cardTitle:   { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' },
  form:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fieldGroup:  { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label:       { fontSize: '0.85rem', fontWeight: 600, color: '#374151' },
  input:       { padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', color: '#0f172a' },
  btn:         { backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem', fontSize: '0.95rem', fontWeight: 600 },
  errorBox:    { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
};

export default ProfilePage;