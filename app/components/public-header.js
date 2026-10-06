'use client';

import { useEffect, useState } from 'react';

export default function PublicHeader({ cartContent = null }) {
  const [navOpen, setNavOpen] = useState(false);
  const [accountLabel, setAccountLabel] = useState('Account');
  const [accountHref, setAccountHref] = useState('/login');

  useEffect(() => {
    function deriveAccountLabel() {
      const customerToken = localStorage.getItem('customerToken');
      const customerName = localStorage.getItem('customerName');
      const customerEmail = localStorage.getItem('customerEmail');
      const adminToken = localStorage.getItem('adminToken');
      const adminEmail = localStorage.getItem('adminEmail');
      const safeCustomerName = customerName && customerName !== 'undefined' && customerName !== 'null'
        ? customerName.trim()
        : '';

      if (customerToken) {
        const displayName = safeCustomerName || customerEmail?.split('@')[0] || 'Account';
        setAccountLabel(displayName);
        setAccountHref('/customer');
        return;
      }

      if (adminToken) {
        setAccountLabel(adminEmail?.split('@')[0] || 'Admin');
        setAccountHref('/admin');
        return;
      }

      setAccountLabel('Account');
      setAccountHref('/login');
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        deriveAccountLabel();
      }
    }

    deriveAccountLabel();
    window.addEventListener('storage', deriveAccountLabel);
    window.addEventListener('focus', deriveAccountLabel);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', deriveAccountLabel);
      window.removeEventListener('focus', deriveAccountLabel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  function closeMenu() {
    setNavOpen(false);
  }

  return (
    <header className="gallery-header public-header">
      <nav className="gallery-nav">
        <div className="gallery-nav-brand">
          <a href="/" className="public-header-brand-link" onClick={closeMenu}>
            <h1>Gabriel</h1>
            <p>Contemporary Art</p>
          </a>
        </div>
        <button
          type="button"
          className={`gallery-menu-toggle${navOpen ? ' is-open' : ''}`}
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-label="Toggle site navigation"
        >
          Menu
        </button>
        <div className={`gallery-nav-links${navOpen ? ' is-open' : ''}`}>
          {cartContent}
          <a href={accountHref} className="gallery-btn gallery-btn-primary" onClick={closeMenu}>{accountLabel}</a>
          <a href="/contact" className="gallery-btn gallery-btn-primary" onClick={closeMenu}>Contact</a>
          <a href="https://instagram.com/goodnessgraciousgabriel/" target="_blank" rel="noopener noreferrer" className="gallery-btn gallery-btn-instagram" onClick={closeMenu}>Follow</a>
        </div>
      </nav>
    </header>
  );
}