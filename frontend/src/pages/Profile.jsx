import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, MapPin, Lock, Save, ShieldCheck } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = { name, phone, location };
      if (password) {
        if (password.length < 6) {
          setLoading(false);
          return showError('New password must be at least 6 characters');
        }
        updateData.password = password;
      }

      await updateProfile(updateData);
      showSuccess('Profile information updated successfully!');
      setPassword('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <div className="avatar-circle" style={{ width: '64px', height: '64px', fontSize: '1.6rem' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {user?.name}
              {user?.role === 'admin' ? (
                <span className="badge badge-admin">Admin</span>
              ) : (
                <ShieldCheck size={18} color="var(--accent-emerald)" title="Verified User" />
              )}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user?.email} • Account Status: <strong style={{ color: 'var(--accent-emerald)' }}>Active</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.6rem' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.6rem', opacity: 0.6, cursor: 'not-allowed' }}
                value={user?.email || ''}
                readOnly
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  className="form-control"
                  style={{ paddingLeft: '2.6rem' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location / City</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.6rem' }}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Change Password (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.6rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            <Save size={18} /> {loading ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
