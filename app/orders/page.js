'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../components/public-header';

function getStatusClass(status) {
  if (status === 'paid') return 'is-paid';
  if (status === 'shipped') return 'is-shipped';
  if (status === 'completed') return 'is-completed';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="auth-shell">
      <PublicHeader />

      <div className="auth-shell-inner">
        <div className="auth-copy">
          <h2>Look up past orders by email.</h2>
          <p>Enter the address used at checkout to see order dates, totals, and current status.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3>My Orders</h3>
            <p>Search recent purchases tied to your checkout email.</p>
          </div>

          <form onSubmit={handleSearch} className="auth-form">
            <div className="auth-field">
              <label htmlFor="order-email">Email Address</label>
              <input
                id="order-email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <button type="submit" className="checkout-button" disabled={loading}>
              {loading ? 'Searching...' : 'View Orders'}
            </button>
          </form>

          {searched && orders.length === 0 && (
            <div className="auth-card-footer">No orders found for this email.</div>
          )}

          {orders.length > 0 && (
            <div className="dashboard-mobile-list" style={{ display: 'grid', marginTop: '1.5rem' }}>
              {orders.map((order) => (
                <div key={order.id} className="dashboard-panel dashboard-mobile-card">
                  <div className="dashboard-mobile-title">Order #{order.id}</div>
                  <div className="dashboard-mobile-row">
                    <span>Date</span>
                    <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Items</span>
                    <strong>{order.items?.length || 0} item(s)</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Total</span>
                    <strong>${(order.total / 100).toFixed(2)}</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Status</span>
                    <span className={`dashboard-status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
