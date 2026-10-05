'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div className="alert alert-error">
        <h2>❌ Payment Cancelled</h2>
        <p>Your payment was cancelled. Your order has been saved as a draft.</p>
        
        {orderId && (
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>
            <strong>Order ID:</strong> #{orderId}
          </p>
        )}

        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          You can try again or contact support if you need help.
        </p>

        <div style={{ marginTop: '1.5rem' }}>
          <a href="/" className="btn">
            ← Back to Shop
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"></div></div>}>
      <CancelContent />
    </Suspense>
  );
}
