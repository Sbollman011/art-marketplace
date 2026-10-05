'use client';

import { useEffect, useState } from 'react';

export default function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, spent: 0, shipped: 0 });

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('customerToken');
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setOrders(data.orders || []);

      // Calculate stats
      const totalOrders = data.orders?.length || 0;
      const totalSpent = data.orders?.reduce((sum, o) => sum + o.total, 0) || 0;
      const shippedOrders = data.orders?.filter(o => o.status === 'shipped' || o.status === 'completed').length || 0;

      setStats({
        total: totalOrders,
        spent: totalSpent,
        shipped: shippedOrders,
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2>Your Orders</h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Total Orders</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.total}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Total Spent</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>${(stats.spent / 100).toFixed(2)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Shipped</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.shipped}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="alert alert-info">
          <p>No orders yet. <a href="/">Shop now!</a></p>
        </div>
      ) : (
        <div className="card">
          <div className="card-content">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Order ID</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Items</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Total</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>#{order.id}</td>
                    <td style={{ padding: '1rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{order.items?.length || 0} item(s)</td>
                    <td style={{ padding: '1rem' }}>${(order.total / 100).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          backgroundColor: order.status === 'paid' ? '#d1fae5' : order.status === 'shipped' ? '#dbeafe' : order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: order.status === 'paid' ? '#065f46' : order.status === 'shipped' ? '#0c2340' : order.status === 'completed' ? '#166534' : '#78350f'
                        }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
