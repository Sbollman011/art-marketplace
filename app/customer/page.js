'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, spent: 0, shipped: 0 });
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem('customerName');
    const email = localStorage.getItem('customerEmail');
    if (!email) {
      router.push('/login');
      return;
    }
    setCustomerName(name || '');
    setCustomerEmail(email);
    fetchOrders();
  }, [router]);

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

  function handleLogout() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
    router.push('/');
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', color: '#f8fafc', padding: '2rem' }}>
      {/* Header with welcome and logout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ec4899', marginBottom: '0.25rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>My Account</h1>
          <p style={{ fontSize: '1.3rem', color: '#f59e0b', fontWeight: '700', letterSpacing: '1px' }}>Welcome, {customerName}!</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '2px solid #ef4444',
            color: '#ef4444',
            borderRadius: '4px',
            fontWeight: '900',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; e.target.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ef4444'; e.target.style.boxShadow = 'none'; }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Account Info */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3rem', padding: '1.5rem', background: 'rgba(236, 72, 153, 0.1)', border: '2px solid #ec4899', borderRadius: '4px' }}>
        <p style={{ color: '#cbd5e1', fontWeight: '500', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Account Email</p>
        <p style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>{customerEmail}</p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #ec4899', borderRadius: '4px', boxShadow: '0 0 20px rgba(236, 72, 153, 0.15)' }}>
          <p style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Total Orders</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ec4899', letterSpacing: '-1px' }}>{stats.total}</p>
        </div>
        <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #f59e0b', borderRadius: '4px', boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)' }}>
          <p style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Total Spent</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f59e0b', letterSpacing: '-1px' }}>${(stats.spent / 100).toFixed(2)}</p>
        </div>
        <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #10b981', borderRadius: '4px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}>
          <p style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Delivered</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981', letterSpacing: '-1px' }}>{stats.shipped}</p>
        </div>
      </div>

      {/* Orders */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', marginBottom: '1.5rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>📦 Order History</h2>

        {orders.length === 0 ? (
          <div style={{ padding: '2rem', background: 'rgba(236, 72, 153, 0.1)', border: '2px solid rgba(236, 72, 153, 0.3)', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '1rem' }}>No orders yet</p>
            <a href="/" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)', color: '#0f172a', textDecoration: 'none', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.6)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
            >🛍️ Start Shopping</a>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '4px', border: '2px solid #ec4899', boxShadow: '0 0 30px rgba(236, 72, 153, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ec4899', background: 'rgba(236, 72, 153, 0.15)' }}>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Order ID</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Items</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontWeight: '900', color: '#ec4899', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(236, 72, 153, 0.3)', background: 'transparent', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '1.5rem', color: '#ec4899', fontWeight: '900', fontSize: '0.95rem' }}>#{order.id}</td>
                    <td style={{ padding: '1.5rem', color: '#cbd5e1', fontSize: '0.95rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1.5rem', color: '#f8fafc', fontSize: '0.95rem', fontWeight: '500' }}>{order.items?.filter(i => i.title).length || 0} item(s)</td>
                    <td style={{ padding: '1.5rem', color: '#f59e0b', fontWeight: '900', fontSize: '1rem' }}>${(order.total / 100).toFixed(2)}</td>
                    <td style={{ padding: '1.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: order.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : order.status === 'shipped' ? 'rgba(245, 158, 11, 0.2)' : order.status === 'completed' ? 'rgba(99, 102, 241, 0.2)' : order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(203, 213, 225, 0.2)',
                        color: order.status === 'paid' ? '#10b981' : order.status === 'shipped' ? '#f59e0b' : order.status === 'completed' ? '#6366f1' : order.status === 'cancelled' ? '#ef4444' : '#cbd5e1',
                        border: '1px solid ' + (order.status === 'paid' ? '#10b981' : order.status === 'shipped' ? '#f59e0b' : order.status === 'completed' ? '#6366f1' : order.status === 'cancelled' ? '#ef4444' : '#cbd5e1')
                      }}>
                        {order.status === 'paid' ? '✓ Paid' : order.status === 'shipped' ? '📦 Shipped' : order.status === 'completed' ? '✓ Completed' : order.status === 'cancelled' ? '✗ Cancelled' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
