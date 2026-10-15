import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Store } from 'lucide-react';
import { auth as authApi } from '../services/api';
import Alert from '../components/Alert';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      // Backend returns { success: true, data: { token, user, shop } }
      // Axios wraps it so: response.data = { success, data: {...} }
      const { token, user, shop } = response.data?.data || {};

      if (token) {
        localStorage.setItem('token', token);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('userName', user.name || 'Dukaandaar');
        }
        if (shop) {
          localStorage.setItem('shop', JSON.stringify(shop));
          localStorage.setItem('shopName', shop.shopName || 'Apni Dukaan');
        }
        navigate('/dashboard');
      } else {
        // Fallback demo token if backend mocked
        localStorage.setItem('token', 'demo-kirana-token');
        localStorage.setItem('userName', 'Ramesh Kirana');
        localStorage.setItem('shopName', 'Ramesh General Store');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback helpful error message
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials or try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-logo-header">
        <div className="auth-logo-title">
          <span>🛒</span>
          <span>Dukaan Sahayak</span>
        </div>
        <p className="auth-logo-tagline">Apni Dukaan, Digital Banao 🇮🇳</p>
      </div>

      <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', textAlign: 'center' }}>
        Log in to your Shop
      </h2>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email or Phone / ईमेल या फोन
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              id="email"
              name="email"
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="name@example.com or 9876543210"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password / पासवर्ड
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="btn-icon"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '4px',
              }}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              style={{ accentColor: 'var(--primary)' }}
            />
            Remember me
          </label>
          <span style={{ color: 'var(--text-secondary)', cursor: 'not-allowed', fontSize: '0.8rem' }}>
            Forgot password?
          </span>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Sign In / लॉगिन करें'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Naye dukaandaar hain?{' '}
        <Link to="/register" style={{ fontWeight: 600 }}>
          Create New Account / खाता बनाएं
        </Link>
      </div>
    </div>
  );
};

export default Login;
