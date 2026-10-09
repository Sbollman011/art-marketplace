'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/categories', label: 'Collections' },
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

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
    router.push('/');
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-row">
          <a href="/" className="dashboard-topbar-brand">
            <h2>Gabriel</h2>
            <p>Studio Admin</p>
          </a>
          <div className="dashboard-topbar-account">
            {adminEmail ? <span className="dashboard-topbar-email">{adminEmail}</span> : null}
            <button type="button" onClick={logout} className="dashboard-topbar-logout">
              Log out
            </button>
          </div>
        </div>
        {/* Pills instead of a drawer: every section stays one tap away, which
            matters most while working through orders. */}
        <nav className="dashboard-tabs" aria-label="Admin sections">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`dashboard-tab${pathname === item.href ? ' is-active' : ''}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
