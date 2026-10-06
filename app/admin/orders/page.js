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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', background: 'var(--dark-bg)', color: '#cbd5e1' }}><p>⏳ Loading...</p></div>;
  }

  return (
    <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#f59e0b', marginBottom: '0.5rem', letterSpacing: '-2px', textTransform: 'uppercase' }}>📦 Orders</h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>Manage Customer Orders & Shipping Status</p>
      </div>

      <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '4px', border: '2px solid #ec4899', boxShadow: '0 0 30px rgba(236, 72, 153, 0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ec4899', background: 'rgba(236, 72, 153, 0.15)' }}>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Order ID</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
              <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr 
                key={order.id} 
                style={{ 
                  borderBottom: '1px solid rgba(236, 72, 153, 0.3)',
                  background: 'transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                  e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(236, 72, 153, 0.15)';
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <td style={{ padding: '1.5rem', color: '#ec4899', fontWeight: '900', fontSize: '0.95rem' }}>#{order.id}</td>
                <td style={{ padding: '1.5rem', color: '#f8fafc', fontSize: '0.95rem', fontWeight: '500' }}>{order.customer_name}</td>
                <td style={{ padding: '1.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{order.customer_email}</td>
                <td style={{ padding: '1.5rem', color: '#f59e0b', fontWeight: '900', fontSize: '1rem' }}>${(order.total / 100).toFixed(2)}</td>
                <td style={{ padding: '1.5rem' }}>
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      border: '2px solid #ec4899',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#0f172a',
                      background: order.status === 'paid' ? '#10b981' : order.status === 'shipped' ? '#f59e0b' : order.status === 'completed' ? '#6366f1' : order.status === 'cancelled' ? '#ef4444' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(236, 72, 153, 0.5)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
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
                    background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
                    color: '#0f172a',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '900',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    border: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; e.target.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.6)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
                  >👁️ View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#cbd5e1' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No orders yet</p>
        </div>
      )}
    </div>
  );
}
