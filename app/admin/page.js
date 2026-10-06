'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const token = localStorage.getItem('adminToken');
      const ordersRes = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productsRes = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = await ordersRes.json();
      const products = await productsRes.json();

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        pendingOrders,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><p style={{ color: '#64748b' }}>⏳ Loading...</p></div>;
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#ec4899' },
    { label: 'Total Revenue', value: `$${(stats.totalRevenue / 100).toFixed(2)}`, icon: '💰', color: '#10b981' },
    { label: 'Products Listed', value: stats.totalProducts, icon: '🎨', color: '#f59e0b' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: '#ef4444' },
  ];

  return (
    <div style={{ background: 'var(--dark-bg)', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#ec4899', marginBottom: '0.5rem', letterSpacing: '-2px', textTransform: 'uppercase' }}>📊 Dashboard</h1>
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem', letterSpacing: '1px' }}>STORE OVERVIEW & QUICK STATS</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {statCards.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%)',
              padding: '2rem',
              borderRadius: '4px',
              border: '2px solid ' + (stat.color === '#10b981' ? '#f59e0b' : stat.color),
              transition: 'all 0.3s',
              boxShadow: `0 0 20px ${stat.color}33`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 30px ${stat.color}66`;
              e.currentTarget.style.borderColor = stat.color === '#10b981' ? '#f59e0b' : stat.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 0 20px ${stat.color}33`;
              e.currentTarget.style.borderColor = stat.color === '#10b981' ? '#f59e0b' : stat.color;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>{stat.icon}</span>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', color: stat.color, letterSpacing: '-1px' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(203, 213, 225, 0.1)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#f59e0b', marginBottom: '1.5rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>⚡ Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <a href="/admin/products" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
            color: '#0f172a',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: '900',
            transition: 'all 0.2s',
            border: '2px solid #ec4899',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.6)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
          >🎨 Add Artwork</a>
          <a href="/admin/orders" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
            background: 'transparent',
            color: '#f59e0b',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: '900',
            border: '2px solid #f59e0b',
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => { e.target.style.background = '#f59e0b'; e.target.style.color = '#0f172a'; e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.6)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#f59e0b'; e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
          >📦 View Orders</a>
        </div>
      </div>
    </div>
  );
}
