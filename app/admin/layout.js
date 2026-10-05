'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      const email = localStorage.getItem('adminEmail');
      setAdminEmail(email || '');
    } else {
      setIsAuthenticated(false);
      router.push('/admin/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    return null; // Router will handle redirect
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white', 
        padding: '1.5rem 0',
        width: '280px', 
        height: '100vh',
        overflowY: 'auto',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid rgba(236, 72, 153, 0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(236, 72, 153, 0.3)' }}>
          <h2 style={{ marginBottom: '0.25rem', color: '#ec4899', fontSize: '1.1rem', fontWeight: '900' }}>🎨 Goodness Gracious</h2>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500' }}>Admin Panel</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
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
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', paddingBottom: '1rem', borderBottom: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 0.25rem 0' }}>Logged in as:</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{adminEmail}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminEmail');
              setIsAuthenticated(false);
              router.push('/admin/login');
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
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
