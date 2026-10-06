'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    setIsLoggedIn(!!token);
    
    if (sessionId && orderId) {
      confirmPayment();
    }
  }, [sessionId, orderId]);

  async function confirmPayment() {
    try {
      const res = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, orderId }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }

      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="status-shell">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', border: '4px solid #c68b45', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p className="status-eyebrow">Confirming payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-shell">
        <div className="status-card">
          <div className="status-chip warning">!</div>
          <h1 style={{ color: '#ef4444' }}>Payment Error</h1>
          <div className="status-stack">
            <div className="status-panel">
              <p>{error}</p>
              <p style={{ color: '#d5d9e2' }}>Please contact support if this persists.</p>
            </div>
            <button onClick={() => router.push('/')} className="checkout-button">Back to Shop</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-shell">
      <div className="status-card">
        <div className="status-chip success">✓</div>
        <h1 style={{ color: '#10b981' }}>Order Confirmed</h1>
        <p>Thank you for your purchase.</p>

        <div className="status-stack">
          <div className="status-panel">
            <p className="status-eyebrow">Order Number</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.35rem' }}>#{order?.id}</p>
            <p className="status-eyebrow" style={{ marginTop: '1rem' }}>Total Amount</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.35rem', color: '#c68b45' }}>${(order?.total / 100).toFixed(2)}</p>
            <p className="status-eyebrow" style={{ marginTop: '1rem' }}>Confirmation Email</p>
            <p style={{ wordBreak: 'break-all', marginTop: '0.35rem' }}>{order?.customer_email}</p>
          </div>

          <div className="status-panel">
            <p className="status-eyebrow">What&apos;s Next</p>
            <p>We&apos;ve sent a confirmation email with your order details. {isLoggedIn ? 'Track your order in your account dashboard.' : 'Sign in to track your order status.'}</p>
          </div>

          <div className="status-actions">
            {isLoggedIn ? (
              <>
                <button onClick={() => router.push('/customer')} className="checkout-button">My Account</button>
                <button onClick={() => router.push('/')} className="dashboard-link-button subtle">Continue Shopping</button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/login')} className="checkout-button">Sign In or Create Account</button>
                <button onClick={() => router.push('/')} className="dashboard-link-button subtle">Continue Shopping</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="status-shell"><div style={{ width: '60px', height: '60px', border: '4px solid #c68b45', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
