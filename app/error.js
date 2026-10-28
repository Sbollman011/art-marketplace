'use client';

import { useEffect, useState } from 'react';

// Without this boundary a render-time crash shows Next.js's bare
// "Application error: a client-side exception has occurred" screen, which tells
// neither the shopper nor us anything useful. Show the real message so a
// non-technical user can read it back over the phone.
export default function AppError({ error, reset }) {
  const [details, setDetails] = useState('');

  useEffect(() => {
    console.error('Client error boundary caught:', error);

    const parts = [];
    if (error?.message) parts.push(error.message);
    if (error?.digest) parts.push(`digest ${error.digest}`);
    setDetails(parts.join(' · ') || 'Unknown error');
  }, [error]);

  function signOutAndRestart() {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerEmail');
      localStorage.removeItem('customerName');
    } catch (storageError) {
      console.error('Could not clear stored session:', storageError);
    }
    window.location.href = '/login';
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        <div className="auth-card">
          <div className="auth-card-header">
            <h3>Something went wrong</h3>
            <p>This page could not finish loading. Try again, or sign in again if the problem continues.</p>
          </div>

          <div className="auth-alert error" style={{ wordBreak: 'break-word' }}>
            {details}
          </div>

          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="checkout-button" onClick={() => reset()}>
              Try Again
            </button>
            <button type="button" className="dashboard-link-button" onClick={signOutAndRestart}>
              Sign In Again
            </button>
            <a href="/" className="dashboard-link-button">Back to Gallery</a>
          </div>
        </div>
      </div>
    </div>
  );
}
