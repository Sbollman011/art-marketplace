'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const email = localStorage.getItem('customerEmail');
    if (token && email) {
      setIsAuthenticated(true);
      setCustomerEmail(email);
    } else {
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    return null; // Router will handle redirect
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
            {localStorage.getItem('adminToken') && (
              <a href="/admin" style={{
                padding: '0.6rem 1.2rem',
                background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                border: '1px solid rgba(236, 72, 153, 0.5)'
              }}
              onMouseEnter={(e) => { e.target.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }}
              >🛠️ Admin Portal</a>
            )}
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
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminEmail');
                router.push('/login');
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
