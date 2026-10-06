'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      const email = localStorage.getItem('adminEmail');
      setAdminEmail(email || '');
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
    <div className="dashboard-shell">
      <button
        type="button"
        className={`dashboard-menu-toggle${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? '×' : '☰'}
      </button>
      <div
        className={`dashboard-overlay${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`dashboard-aside${menuOpen ? ' is-open' : ''}`}>
        <div className="dashboard-brand">
          <a href="/">
            <h2>Gabriel</h2>
            <p>Studio</p>
          </a>
        </div>
        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`dashboard-nav-link${pathname === item.href ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="dashboard-account">
          <div className="dashboard-account-copy">
            Logged in as:
            <strong>{adminEmail}</strong>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminEmail');
              setIsAuthenticated(false);
              router.push('/');
            }}
            className="dashboard-utility-btn danger"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
