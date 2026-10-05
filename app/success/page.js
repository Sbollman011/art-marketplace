'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner"></div>
        <p>Confirming your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert alert-error">
          <h2>⚠️ Payment Error</h2>
          <p>{error}</p>
          <p>Please contact support if this persists.</p>
          <a href="/" className="btn">← Back to Shop</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div className="alert alert-success">
        <h2>✅ Payment Successful!</h2>
        <p>Thank you for your purchase!</p>
        
        <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <p><strong>Order ID:</strong> #{order?.id}</p>
          <p><strong>Total:</strong> ${(order?.total / 100).toFixed(2)}</p>
          <p><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>Paid</span></p>
          <p><strong>Email:</strong> {order?.customer_email}</p>
        </div>

        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          A confirmation email has been sent to <strong>{order?.customer_email}</strong>
        </p>

        <div style={{ marginTop: '1.5rem' }}>
          <a href="/orders" className="btn btn-secondary" style={{ marginRight: '1rem' }}>
            View Orders
          </a>
          <a href="/" className="btn">
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}
