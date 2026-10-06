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
      <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', border: '4px solid #ec4899', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirming payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', color: '#f8fafc', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '80px', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef4444', marginBottom: '0.5rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>Payment Error</h1>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', borderRadius: '4px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#fca5a5', fontSize: '1rem', marginBottom: '1rem' }}>{error}</p>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Please contact support if this persists.</p>
          </div>
          <button onClick={() => router.push('/')} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)', color: '#0f172a', border: 'none', borderRadius: '4px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>← Back to Shop</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', color: '#f8fafc', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 2rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '60px',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)'
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981', marginBottom: '0.5rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>Order Confirmed</h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>Thank You for Your Purchase!</p>
        </div>

        {/* Order Info Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #ec4899', borderRadius: '4px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 0 30px rgba(236, 72, 153, 0.2)' }}>
          <p style={{ color: '#cbd5e1', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Order Number</p>
          <p style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ec4899', marginBottom: '1.5rem', letterSpacing: '-1px' }}>#{order?.id}</p>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <p style={{ color: '#cbd5e1', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Amount</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b', margin: 0, letterSpacing: '-1px' }}>${(order?.total / 100).toFixed(2)}</p>
          </div>

          <p style={{ color: '#cbd5e1', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Confirmation Email</p>
          <p style={{ color: '#f8fafc', fontSize: '1rem', margin: 0, wordBreak: 'break-all' }}>{order?.customer_email}</p>
        </div>

        {/* What's Next */}
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '2px solid #06b6d4', borderRadius: '4px', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ color: '#cbd5e1', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>What's Next?</p>
          <p style={{ color: '#f8fafc', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
            We've sent a confirmation email with your order details. {isLoggedIn ? 'Track your order in your account dashboard.' : 'Sign in to track your order status.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {isLoggedIn ? (
            <>
              <button
                onClick={() => router.push('/customer')}
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
                📊 My Account
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
                🛍️ Continue Shopping
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
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
                🔐 Sign In or Create Account
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
                🛍️ Continue Shopping
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--dark-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '60px', height: '60px', border: '4px solid #ec4899', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
