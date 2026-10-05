'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const email = localStorage.getItem('customerEmail');
    if (token && email) {
      setIsAuthenticated(true);
      setCustomerEmail(email);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <CustomerAuthPage onLoginSuccess={(email) => {
      setIsAuthenticated(true);
      setCustomerEmail(email);
    }} />;
  }

  return (
    <div>
      <header className="gallery-header">
        <nav className="gallery-nav">
          <div className="gallery-nav-brand">
            <h1>🎨 Goodness Gracious Gabriel</h1>
            <p>Welcome back, {customerEmail}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/" className="gallery-btn gallery-btn-primary">← Back to Gallery</a>
            <button 
              className="gallery-btn gallery-btn-primary"
              onClick={() => {
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerEmail');
                setIsAuthenticated(false);
              }}
              style={{ background: '#ef4444' }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
            >
              🚪 Logout
            </button>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}

function CustomerAuthPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/customer/signup' : '/api/customer/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customerEmail', data.customer.email);
      onLoginSuccess(data.customer.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="gallery-header">
        <nav className="gallery-nav">
          <div className="gallery-nav-brand">
            <h1>🎨 Goodness Gracious Gabriel</h1>
            <p>Customer Account</p>
          </div>
          <a href="/" className="gallery-btn gallery-btn-primary">← Back to Gallery</a>
        </nav>
      </header>

      {/* Auth Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="gallery-checkout-container" style={{ width: '100%', maxWidth: '500px' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{isSignup ? 'Create Account' : 'Login to Your Account'}</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {isSignup ? 'Sign up to view your orders and track purchases' : 'Login to view your order history and track purchases'}
          </p>

          <form onSubmit={handleSubmit} className="checkout-form">
            {error && <div className="checkout-error">{error}</div>}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="checkout-button" disabled={loading}>
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              style={{ 
                background: 'none',
                border: 'none',
                color: '#ec4899',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'underline',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {isSignup ? 'Login instead' : 'Sign up instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
