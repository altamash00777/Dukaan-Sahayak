import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Store, MapPin, FileText, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { auth as authApi } from '../services/api';
import Alert from '../components/Alert';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Step 2: Shop Info
    shopName: '',
    address: '',
    gstin: '',
    language: 'hinglish',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all personal details.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.shopName || !formData.address) {
      setError('Please provide your shop name and address.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        shopName: formData.shopName,
        address: formData.address,
        gstin: formData.gstin || undefined,
        language: formData.language,
      };

      const res = await authApi.register(payload);
      // Backend returns { success: true, data: { token, user, shop } }
      // Axios wraps it so: res.data = { success, data: {...} }
      const { token, user, shop } = res.data?.data || {};

      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.setItem('token', 'demo-kirana-token');
      }

      localStorage.setItem('user', JSON.stringify(user || { name: formData.name, email: formData.email }));
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('shop', JSON.stringify(shop || { name: formData.shopName, address: formData.address }));
      localStorage.setItem('shopName', formData.shopName);
      localStorage.setItem('shopPhone', formData.phone);
      localStorage.setItem('shopAddress', formData.address);
      if (formData.gstin) localStorage.setItem('gstin', formData.gstin);

      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
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

      {/* Multi-step progress indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.75rem',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: step === 1 ? 'var(--primary)' : 'var(--success)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: step === 1 ? 'var(--primary)' : 'var(--success)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
            }}
          >
            1
          </div>
          <span>Owner Info</span>
        </div>

        <div
          style={{
            width: '40px',
            height: '2px',
            backgroundColor: step === 2 ? 'var(--primary)' : 'var(--border)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: step === 2 ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: step === 2 ? 'var(--primary)' : 'var(--border)',
              color: step === 2 ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
            }}
          >
            2
          </div>
          <span>Shop Info</span>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {step === 1 ? (
        /* STEP 1: Personal Info */
        <form onSubmit={handleNextStep}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Your Full Name / आपका नाम
            </label>
            <div style={{ position: 'relative' }}>
              <User
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
                id="name"
                name="name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ramesh Kumar"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address / ईमेल
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
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="ramesh@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Mobile Number / मोबाइल नंबर
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
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
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Set Password / पासवर्ड
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
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password / पासवर्ड दोबारा डालें
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
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            <span>Next: Shop Details / दुकान की जानकारी</span>
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        /* STEP 2: Shop Info */
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="shopName">
              Shop Name / दुकान का नाम
            </label>
            <div style={{ position: 'relative' }}>
              <Store
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
                id="shopName"
                name="shopName"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ramesh General Store / किराना स्टोर"
                value={formData.shopName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">
              Shop Address / दुकान का पता
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '14px',
                  color: 'var(--text-secondary)',
                }}
              />
              <textarea
                id="address"
                name="address"
                className="form-input"
                style={{ paddingLeft: '2.5rem', minHeight: '75px' }}
                placeholder="Shop No. 12, Main Bazaar, Landmark, City..."
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gstin">
              GSTIN (Optional / अगर है तो डालें)
            </label>
            <div style={{ position: 'relative' }}>
              <FileText
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
                id="gstin"
                name="gstin"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="22AAAAA0000A1Z5 (15 digits)"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="language">
              Preferred Language / भाषा पसंद
            </label>
            <div style={{ position: 'relative' }}>
              <Globe
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                }}
              />
              <select
                id="language"
                name="language"
                className="form-select"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.language}
                onChange={handleChange}
              >
                <option value="hinglish">Hinglish (Hindi + English)</option>
                <option value="hindi">हिंदी (Hindi)</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep(1)}
              style={{ flex: 1 }}
              disabled={loading}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Shop / शुरू करें'}
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ fontWeight: 600 }}>
          Login here / लॉगिन करें
        </Link>
      </div>
    </div>
  );
};

export default Register;
