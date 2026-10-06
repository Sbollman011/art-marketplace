'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', color: '#f8fafc', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        {/* Cancel Icon */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 2rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '60px',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.5)'
          }}>
            ✕
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef4444', marginBottom: '0.5rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>Payment Cancelled</h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>Order Saved as Draft</p>
        </div>

        {/* Info Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #f59e0b', borderRadius: '4px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)' }}>
          <p style={{ color: '#cbd5e1', fontWeight: '600', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Order Information</p>
          
          {orderId && (
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderLeft: '4px solid #ec4899', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p style={{ color: '#cbd5e1', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Order ID</p>
              <p style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ec4899', margin: 0, letterSpacing: '-1px' }}>#{orderId}</p>
            </div>
          )}

          <p style={{ color: '#f8fafc', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
            Your order has been saved. You can return to checkout anytime to complete your purchase using this order ID.
          </p>
        </div>

        {/* Helpful Info */}
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', borderRadius: '4px', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ color: '#cbd5e1', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>What Happened?</p>
          <ul style={{ color: '#f8fafc', fontSize: '0.95rem', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
            <li>Your payment was not processed</li>
            <li>Your order has been saved as a draft</li>
            <li>No money was charged</li>
            <li>You can try again anytime</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '900',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.6)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '1rem',
              background: 'transparent',
              color: '#f59e0b',
              border: '2px solid #f59e0b',
              borderRadius: '4px',
              fontWeight: '900',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => { e.target.style.background = '#f59e0b'; e.target.style.color = '#0f172a'; e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.6)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#f59e0b'; e.target.style.boxShadow = 'none'; }}
          >
            ← Back to Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--dark-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '60px', height: '60px', border: '4px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div></div>}>
      <CancelContent />
    </Suspense>
  );
}
