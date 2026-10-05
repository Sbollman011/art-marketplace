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
      <header style={{ background: '#f3f4f6', padding: '1.5rem', marginBottom: '2rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Account</h1>
          <p style={{ color: '#6b7280' }}>Logged in as: <strong>{customerEmail}</strong></p>
        </div>
        <button 
          className="btn btn-small"
          onClick={() => {
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customerEmail');
            setIsAuthenticated(false);
          }}
        >
          🚪 Logout
        </button>
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
    <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div className="card">
        <div className="card-content">
          <h1>{isSignup ? 'Create Account' : 'Login to Your Account'}</h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {isSignup ? 'Sign up to view your orders and track purchases' : 'Login to view your order history and track purchases'}
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

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

            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
