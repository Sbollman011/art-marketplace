'use client';

import { useEffect, useState } from 'react';

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
    <div>
      <h1>My Orders</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '2rem', maxWidth: '400px' }}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? 'Searching...' : 'View Orders'}
        </button>
      </form>

      {searched && orders.length === 0 && (
        <div className="alert alert-info">No orders found for this email.</div>
      )}

      {orders.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>{order.items?.length || 0} item(s)</td>
                <td>${(order.total / 100).toFixed(2)}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    backgroundColor: order.status === 'paid' ? '#d1fae5' : order.status === 'shipped' ? '#dbeafe' : '#fef3c7',
                    color: order.status === 'paid' ? '#065f46' : order.status === 'shipped' ? '#0c2340' : '#78350f'
                  }}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
