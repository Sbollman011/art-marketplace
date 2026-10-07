'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PublicHeader from '../components/public-header';

function CancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      return;
    }

    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    }).catch((error) => {
      console.error('Failed to mark order as cancelled:', error);
    });
  }, [orderId]);

  return (
    <div className="public-page-frame">
      <PublicHeader />
      <div className="status-shell">
        <div className="status-card">
          <div className="status-chip warning">×</div>
          <h1 style={{ color: '#ef4444' }}>Payment Cancelled</h1>
          <p>This checkout was cancelled.</p>

          <div className="status-stack">
            <div className="status-panel">
              <p className="status-eyebrow">Order Information</p>
              {orderId && <p style={{ marginTop: '0.45rem', fontSize: '1.2rem', fontWeight: 800 }}>Order #{orderId}</p>}
              <p style={{ marginTop: '0.75rem' }}>No payment was processed. If you still want the artwork, just return to the shop and start checkout again.</p>
            </div>

            <div className="status-panel">
              <p className="status-eyebrow">What Happened</p>
              <ul>
                <li>Your payment was not processed.</li>
                <li>This pending order has been cancelled.</li>
                <li>No money was charged.</li>
                <li>You can try checkout again anytime.</li>
              </ul>
            </div>

            <div className="status-actions">
              <button onClick={() => router.push('/')} className="checkout-button">Try Again</button>
              <button onClick={() => router.push('/')} className="dashboard-link-button subtle">Back to Shop</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div className="status-shell"><div style={{ width: '60px', height: '60px', border: '4px solid #c68b45', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div></div>}>
      <CancelContent />
    </Suspense>
  );
}
