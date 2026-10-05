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
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: '#1f2937', color: 'white', padding: '1.5rem 0' }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Admin Panel</h3>
          <p style={{ fontSize: '0.85rem', color: '#d1d5db' }}>Manage artwork & orders</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="/admin" style={{ padding: '0.75rem 1.5rem', color: 'white', textDecoration: 'none' }}>📊 Dashboard</a>
          <a href="/admin/products" style={{ padding: '0.75rem 1.5rem', color: 'white', textDecoration: 'none' }}>🎨 Products</a>
          <a href="/admin/orders" style={{ padding: '0.75rem 1.5rem', color: 'white', textDecoration: 'none' }}>📦 Orders</a>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              setIsAuthenticated(false);
            }} 
            style={{ padding: '0.75rem 1.5rem', color: 'white', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            🚪 Logout
          </button>
        </nav>
      </aside>
      <main style={{ padding: '2rem' }}>
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
