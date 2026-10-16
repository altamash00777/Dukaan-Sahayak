// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Eye, EyeOff, Lock, Mail, Store } from 'lucide-react';
// import { auth as authApi } from '../services/api';
// import Alert from '../components/Alert';

// const Login = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     rememberMe: false,
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!formData.email || !formData.password) {
//       setError('Please fill in both email and password.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await authApi.login({
//         email: formData.email,
//         password: formData.password,
//       });

//       // Backend returns { success: true, data: { token, user, shop } }
//       // Axios wraps it so: response.data = { success, data: {...} }
//       const { token, user, shop } = response.data?.data || {};

//       if (token) {
//         localStorage.setItem('token', token);
//         if (user) {
//           localStorage.setItem('user', JSON.stringify(user));
//           localStorage.setItem('userName', user.name || 'Dukaandaar');
//         }
//         if (shop) {
//           localStorage.setItem('shop', JSON.stringify(shop));
//           localStorage.setItem('shopName', shop.shopName || 'Apni Dukaan');
//         }
//         navigate('/dashboard');
//       } else {
//         // Fallback demo token if backend mocked
//         localStorage.setItem('token', 'demo-kirana-token');
//         localStorage.setItem('userName', 'Ramesh Kirana');
//         localStorage.setItem('shopName', 'Ramesh General Store');
//         navigate('/dashboard');
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       // Fallback helpful error message
//       const msg =
//         err.response?.data?.message ||
//         err.message ||
//         'Login failed. Please check your credentials or try again.';
//       setError(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-card">
//       <div className="auth-logo-header">
//         <div className="auth-logo-title">
//           <span>🛒</span>
//           <span>Dukaan Sahayak</span>
//         </div>
//         <p className="auth-logo-tagline">Apni Dukaan, Digital Banao 🇮🇳</p>
//       </div>

//       <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', textAlign: 'center' }}>
//         Log in to your Shop
//       </h2>

//       {error && <Alert type="error" message={error} onClose={() => setError('')} />}

//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label className="form-label" htmlFor="email">
//             Email or Phone / ईमेल या फोन
//           </label>
//           <div style={{ position: 'relative' }}>
//             <Mail
//               size={18}
//               style={{
//                 position: 'absolute',
//                 left: '12px',
//                 top: '50%',
//                 transform: 'translateY(-50%)',
//                 color: 'var(--text-secondary)',
//               }}
//             />
//             <input
//               id="email"
//               name="email"
//               type="text"
//               className="form-input"
//               style={{ paddingLeft: '2.5rem' }}
//               placeholder="name@example.com or 9876543210"
//               value={formData.email}
//               onChange={handleChange}
//               autoComplete="username"
//               required
//             />
//           </div>
//         </div>

//         <div className="form-group">
//           <label className="form-label" htmlFor="password">
//             Password / पासवर्ड
//           </label>
//           <div style={{ position: 'relative' }}>
//             <Lock
//               size={18}
//               style={{
//                 position: 'absolute',
//                 left: '12px',
//                 top: '50%',
//                 transform: 'translateY(-50%)',
//                 color: 'var(--text-secondary)',
//               }}
//             />
//             <input
//               id="password"
//               name="password"
//               type={showPassword ? 'text' : 'password'}
//               className="form-input"
//               style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
//               placeholder="Enter your password"
//               value={formData.password}
//               onChange={handleChange}
//               autoComplete="current-password"
//               required
//             />
//             <button
//               type="button"
//               className="btn-icon"
//               style={{
//                 position: 'absolute',
//                 right: '8px',
//                 top: '50%',
//                 transform: 'translateY(-50%)',
//                 padding: '4px',
//               }}
//               onClick={() => setShowPassword(!showPassword)}
//               aria-label={showPassword ? 'Hide password' : 'Show password'}
//             >
//               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>
//         </div>

//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             marginBottom: '1.25rem',
//             fontSize: '0.875rem',
//           }}
//         >
//           <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
//             <input
//               type="checkbox"
//               name="rememberMe"
//               checked={formData.rememberMe}
//               onChange={handleChange}
//               style={{ accentColor: 'var(--primary)' }}
//             />
//             Remember me
//           </label>
//           <span style={{ color: 'var(--text-secondary)', cursor: 'not-allowed', fontSize: '0.8rem' }}>
//             Forgot password?
//           </span>
//         </div>

//         <button
//           type="submit"
//           className="btn btn-primary"
//           style={{ width: '100%', padding: '0.75rem' }}
//           disabled={loading}
//         >
//           {loading ? 'Logging in...' : 'Sign In / लॉगिन करें'}
//         </button>
//       </form>

//       <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
//         Naye dukaandaar hain?{' '}
//         <Link to="/register" style={{ fontWeight: 600 }}>
//           Create New Account / खाता बनाएं
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default Login;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Store,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

import { auth as authApi } from '../services/api';
import Alert from '../components/Alert';
import './Login.css';

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

    if (!formData.email.trim() || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
      });

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
        // Demo fallback retained from your original implementation.
        localStorage.setItem('token', 'demo-kirana-token');
        localStorage.setItem('userName', 'Ramesh Kirana');
        localStorage.setItem('shopName', 'Ramesh General Store');

        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);

      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials or try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ds-login-page">
      <div className="ds-login-glow ds-login-glow-one" />
      <div className="ds-login-glow ds-login-glow-two" />

      <header className="ds-login-navbar">
        <Link to="/" className="ds-login-brand">
          <span className="ds-login-brand-icon">
            <Store size={23} strokeWidth={2.2} />
          </span>

          <span className="ds-login-brand-text">
            Dukaan Sahayak
            <small>SMART BUSINESS. SIMPLE LIFE.</small>
          </span>
        </Link>

        <Link to="/register" className="ds-login-top-link">
          New to Dukaan Sahayak?
          <span>Create account <ArrowRight size={15} /></span>
        </Link>
      </header>

      <section className="ds-login-layout">
        <div className="ds-login-intro">
          <div className="ds-login-eyebrow">
            <span className="ds-login-status-dot" />
            YOUR BUSINESS, NOW DIGITAL
          </div>

          <h1>
            Your dukaan.
            <br />
            Your business.
            <br />
            <span>Your growth.</span>
          </h1>

          <p className="ds-login-description">
            Manage billing, track inventory, maintain customer records
            and simplify your everyday shop operations — all in one place.
          </p>

          <div className="ds-login-benefits">
            <div className="ds-login-benefit">
              <span className="ds-login-benefit-icon">
                <BarChart3 size={19} />
              </span>
              <div>
                <strong>Know your business</strong>
                <span>Sales, reports and insights at a glance.</span>
              </div>
            </div>

            <div className="ds-login-benefit">
              <span className="ds-login-benefit-icon">
                <Smartphone size={19} />
              </span>
              <div>
                <strong>Simple digital management</strong>
                <span>Your shop records, organized in one place.</span>
              </div>
            </div>
          </div>

          <div className="ds-login-trust">
            <span className="ds-login-trust-icon">
              <ShieldCheck size={19} />
            </span>
            <span>
              <strong>Built for everyday business</strong>
              <small>Simple tools for India's local shopkeepers.</small>
            </span>
          </div>

          <div className="ds-login-decoration ds-login-decoration-one" />
          <div className="ds-login-decoration ds-login-decoration-two" />
        </div>

        <div className="ds-login-form-side">
          <div className="ds-login-card">
            <div className="ds-login-card-heading">
              <div className="ds-login-card-icon">
                <Lock size={21} />
              </div>

              <span className="ds-login-card-kicker">
                WELCOME BACK
              </span>

              <h2>Log in to your shop</h2>

              <p>
                Enter your details to access your business dashboard.
              </p>
            </div>

            {error && (
              <div className="ds-login-alert">
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError('')}
                />
              </div>
            )}

            <form className="ds-login-form" onSubmit={handleSubmit}>
              <div className="ds-login-field">
                <label htmlFor="email">
                  Email or phone
                  <span>ईमेल या फोन</span>
                </label>

                <div className="ds-login-input-wrap">
                  <Mail size={18} className="ds-login-input-icon" />

                  <input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="name@example.com or 9876543210"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="ds-login-field">
                <label htmlFor="password">
                  Password
                  <span>पासवर्ड</span>
                </label>

                <div className="ds-login-input-wrap">
                  <Lock size={18} className="ds-login-input-icon" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="ds-login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="ds-login-options">
                <label className="ds-login-remember">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>

                <span className="ds-login-forgot">
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                className="ds-login-submit"
                disabled={loading}
              >
                <span>
                  {loading ? 'Logging in...' : 'Sign in to your shop'}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="ds-login-divider">
              <span>YOUR BUSINESS, YOUR CONTROL</span>
            </div>

            <div className="ds-login-secure-note">
              <ShieldCheck size={16} />
              <span>Your shop dashboard is just one step away.</span>
            </div>

            <p className="ds-login-register">
              Naye dukaandaar hain?
              <Link to="/register">
                Create new account <ArrowRight size={14} />
              </Link>
            </p>
          </div>

          <div className="ds-login-footer">
            <span>© {new Date().getFullYear()} Dukaan Sahayak</span>
            <span className="ds-login-footer-status">
              <CheckCircle2 size={13} /> Made for local businesses
            </span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
