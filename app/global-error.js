'use client';

import { useEffect } from 'react';

// Last-resort boundary for crashes that happen in the root layout itself,
// where app/error.js cannot render.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', lineHeight: 1.5 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ marginBottom: '1rem' }}>
          The page could not load. Please try again.
        </p>
        <p style={{ marginBottom: '1.5rem', color: '#8f2d1f', wordBreak: 'break-word' }}>
          {error?.message || 'Unknown error'}
          {error?.digest ? ` · digest ${error.digest}` : ''}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: '0.75rem 1.25rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
