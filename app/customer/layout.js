'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const email = localStorage.getItem('customerEmail');
    if (token && email) {
      const adminToken = localStorage.getItem('adminToken');
      const adminEmail = localStorage.getItem('adminEmail');
      setHasAdminAccess(Boolean(adminToken && adminEmail && adminEmail === email));
      setIsAuthenticated(true);
      setCustomerEmail(email);
    } else {
      setHasAdminAccess(false);
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
      <header className="customer-shell-header">
        <nav className="customer-shell-bar">
          <div className="customer-shell-brand">
            <a href="/">
              <h1>Gabriel</h1>
              <p>{customerEmail}</p>
            </a>
          </div>
          <div className="customer-shell-actions">
            {hasAdminAccess && (
              <a href="/admin" className="dashboard-link-button accent">Admin Portal</a>
            )}
            <button 
              onClick={() => {
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerEmail');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminEmail');
                router.push('/');
              }}
              className="dashboard-link-button danger"
            >Logout</button>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
