import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Mail, Lock, Shield, User } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      showSuccess(`Welcome, ${user.name}!`);

      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/products';
        navigate(from, { replace: true });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPass);
      showSuccess(`Logged in as ${user.name}`);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="glass-card" style={{ padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <LogIn size={24} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Account Sign In
          </h2>
        </div>

        {/* Quick Demo Logins: Admin & User */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', border: '1px dashed var(--border-color-light)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem', textAlign: 'center' }}>
            ⚡ Demo Accounts
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              onClick={() => handleQuickLogin('admin@marketplace.com', 'admin123')}
            >
              <Shield size={16} color="#f59e0b" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              onClick={() => handleQuickLogin('user@marketplace.com', 'user123')}
            >
              <User size={16} color="var(--primary)" />
              <span>User Login</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.6rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.6rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Need an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
