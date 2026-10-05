'use client';

import { useEffect, useState } from 'react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map(o => o.id === orderId ? updated : o));
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><p style={{ color: '#64748b' }}>⏳ Loading...</p></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>📦 Orders</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Manage customer orders and shipping status</p>
      </div>

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(217, 70, 239, 0.05) 100%)' }}>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Order ID</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Customer</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Email</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Total</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Status</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr 
                key={order.id} 
                style={{ 
                  borderBottom: '1px solid #e2e8f0',
                  background: idx % 2 === 0 ? 'white' : '#f8fafc',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fafc'}
              >
                <td style={{ padding: '1.5rem', color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>#{order.id}</td>
                <td style={{ padding: '1.5rem', color: '#0f172a', fontSize: '0.95rem' }}>{order.customer_name}</td>
                <td style={{ padding: '1.5rem', color: '#64748b', fontSize: '0.95rem' }}>{order.customer_email}</td>
                <td style={{ padding: '1.5rem', color: '#ec4899', fontWeight: '700', fontSize: '0.95rem' }}>${(order.total / 100).toFixed(2)}</td>
                <td style={{ padding: '1.5rem' }}>
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#0f172a',
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="paid">✓ Paid</option>
                    <option value="shipped">📦 Shipped</option>
                    <option value="completed">✓ Completed</option>
                    <option value="cancelled">✗ Cancelled</option>
                  </select>
                </td>
                <td style={{ padding: '1.5rem' }}>
                  <a href={`/admin/orders/${order.id}`} style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: '#ec4899',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#db2777'; e.target.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#ec4899'; e.target.style.transform = 'scale(1)'; }}
                  >👁️ View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No orders yet</p>
        </div>
      )}
    </div>
  );
}
