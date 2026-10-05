'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white', 
        padding: '1.5rem 0',
        position: 'fixed', 
        left: 0, 
        top: 0, 
        height: '100vh', 
        width: '280px', 
        overflowY: 'auto',
        borderRight: '1px solid rgba(236, 72, 153, 0.2)'
      }}>
        <div style={{ padding: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(236, 72, 153, 0.3)' }}>
          <h2 style={{ marginBottom: '0.25rem', color: '#ec4899', fontSize: '1.1rem', fontWeight: '900' }}>🎨 Goodness Gracious</h2>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500' }}>Admin Panel</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <a href="/admin" style={{ 
            padding: '0.75rem 1.5rem', 
            color: '#cbd5e1', 
            textDecoration: 'none', 
            display: 'block', 
            transition: 'all 0.2s',
            borderLeft: '3px solid transparent',
            fontSize: '0.95rem',
            fontWeight: '500'
          }} 
          onMouseEnter={(e) => { e.target.style.background = 'rgba(236, 72, 153, 0.15)'; e.target.style.borderLeftColor = '#ec4899'; e.target.style.color = '#ec4899'; }}
          onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.borderLeftColor = 'transparent'; e.target.style.color = '#cbd5e1'; }}
          >📊 Dashboard</a>
          <a href="/admin/products" style={{ 
            padding: '0.75rem 1.5rem', 
            color: '#cbd5e1', 
            textDecoration: 'none', 
            display: 'block', 
            transition: 'all 0.2s',
            borderLeft: '3px solid transparent',
            fontSize: '0.95rem',
            fontWeight: '500'
          }} 
          onMouseEnter={(e) => { e.target.style.background = 'rgba(236, 72, 153, 0.15)'; e.target.style.borderLeftColor = '#ec4899'; e.target.style.color = '#ec4899'; }}
          onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.borderLeftColor = 'transparent'; e.target.style.color = '#cbd5e1'; }}
          >🎨 Products</a>
          <a href="/admin/orders" style={{ 
            padding: '0.75rem 1.5rem', 
            color: '#cbd5e1', 
            textDecoration: 'none', 
            display: 'block', 
            transition: 'all 0.2s',
            borderLeft: '3px solid transparent',
            fontSize: '0.95rem',
            fontWeight: '500'
          }} 
          onMouseEnter={(e) => { e.target.style.background = 'rgba(236, 72, 153, 0.15)'; e.target.style.borderLeftColor = '#ec4899'; e.target.style.color = '#ec4899'; }}
          onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.borderLeftColor = 'transparent'; e.target.style.color = '#cbd5e1'; }}
          >📦 Orders</a>
          <a href="/admin/settings" style={{ 
            padding: '0.75rem 1.5rem', 
            color: '#cbd5e1', 
            textDecoration: 'none', 
            display: 'block', 
            transition: 'all 0.2s',
            borderLeft: '3px solid transparent',
            fontSize: '0.95rem',
            fontWeight: '500'
          }} 
          onMouseEnter={(e) => { e.target.style.background = 'rgba(236, 72, 153, 0.15)'; e.target.style.borderLeftColor = '#ec4899'; e.target.style.color = '#ec4899'; }}
          onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.borderLeftColor = 'transparent'; e.target.style.color = '#cbd5e1'; }}
          >⚙️ Settings</a>
        </nav>
        <div style={{ padding: '1.5rem', marginTop: 'auto', borderTop: '1px solid rgba(236, 72, 153, 0.3)' }}>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              setIsAuthenticated(false);
            }} 
            style={{ 
              width: '100%',
              padding: '0.75rem 1.5rem', 
              color: '#ef4444', 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: 'pointer', 
              textAlign: 'center',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; e.target.style.borderColor = '#ef4444'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
      <main style={{ padding: '2rem', marginLeft: '280px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h1>Admin Login</h1>
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
          />
        </div>

        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
