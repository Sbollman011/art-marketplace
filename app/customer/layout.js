'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in - redirect to admin portal
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      router.push('/admin');
      return;
    }

    const token = localStorage.getItem('customerToken');
    const email = localStorage.getItem('customerEmail');
    if (token && email) {
      setIsAuthenticated(true);
      setCustomerEmail(email);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    return <CustomerAuthPage onLoginSuccess={(email) => {
      setIsAuthenticated(true);
      setCustomerEmail(email);
    }} />;
  }

  return (
    <div>
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #2d1b4e 50%, #0f172a 100%)',
        borderBottom: '2px solid #ec4899',
        padding: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15)'
      }}>
        <nav style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem',
            minWidth: 0
          }}>
            <h1 style={{
              margin: 0,
              background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.8rem',
              fontWeight: '900',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              🎨 GGG
            </h1>
            <p style={{
              margin: 0,
              color: '#cbd5e1',
              fontSize: '0.9rem',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              {customerEmail}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(226, 232, 240, 0.1)',
              color: '#cbd5e1',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              border: '1px solid rgba(226, 232, 240, 0.2)'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(226, 232, 240, 0.15)'; e.target.style.borderColor = 'rgba(236, 72, 153, 0.5)'; e.target.style.color = '#ec4899'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(226, 232, 240, 0.1)'; e.target.style.borderColor = 'rgba(226, 232, 240, 0.2)'; e.target.style.color = '#cbd5e1'; }}
            >← Gallery</a>
            <button 
              onClick={() => {
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerEmail');
                setIsAuthenticated(false);
              }}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            >🚪 Logout</button>
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
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #2d1b4e 50%, #0f172a 100%)',
        borderBottom: '2px solid #ec4899',
        boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15)'
      }}>
        <nav style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <h1 style={{
            margin: 0,
            background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '1.8rem',
            fontWeight: '900',
            letterSpacing: '-0.02em'
          }}>
            🎨 GGG
          </h1>
          <a href="/" style={{
            padding: '0.6rem 1.2rem',
            background: 'rgba(226, 232, 240, 0.1)',
            color: '#cbd5e1',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            border: '1px solid rgba(226, 232, 240, 0.2)'
          }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(226, 232, 240, 0.15)'; e.target.style.borderColor = 'rgba(236, 72, 153, 0.5)'; e.target.style.color = '#ec4899'; }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(226, 232, 240, 0.1)'; e.target.style.borderColor = 'rgba(226, 232, 240, 0.2)'; e.target.style.color = '#cbd5e1'; }}
          >← Gallery</a>
        </nav>
      </header>

      {/* Auth Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="gallery-checkout-container" style={{ width: '100%', maxWidth: '500px' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{isSignup ? 'Create Account' : 'Access Your Account'}</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {isSignup ? 'Join us to track your gallery pieces' : 'View your orders and collection'}
          </p>

          <form onSubmit={handleSubmit} className="checkout-form">
            {error && (
              <div style={{ 
                background: '#fee2e2', 
                border: '1px solid #fecaca', 
                color: '#991b1b', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                fontWeight: '500'
              }}>
                ❌ {error}
                {error.includes('admin') && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #fecaca' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>👉 Are you an admin?</p>
                    <a href="/admin/login" style={{
                      display: 'inline-block',
                      background: '#ec4899',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      marginTop: '0.5rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#db2777'}
                    onMouseLeave={(e) => e.target.style.background = '#ec4899'}
                    >Go to Admin Login →</a>
                  </div>
                )}
              </div>
            )}

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
