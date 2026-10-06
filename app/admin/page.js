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
    <div className="dashboard-workspace">
      <div className="dashboard-hero">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtle">Store overview and current activity.</p>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`dashboard-kpi-card ${
              stat.label === 'Total Orders' ? 'accent-rust' :
              stat.label === 'Total Revenue' ? 'accent-green' :
              stat.label === 'Products Listed' ? 'accent-amber' : 'accent-red'
            }`}
          >
            <label>{stat.label}</label>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <section className="dashboard-panel dashboard-section">
        <div className="dashboard-section-head">
          <h2>Quick Actions</h2>
          <p className="dashboard-subtle">Move between inventory and fulfillment.</p>
        </div>
        <div className="dashboard-header-actions">
          <a href="/admin/products" className="dashboard-link-button accent">Add Artwork</a>
          <a href="/admin/orders" className="dashboard-link-button subtle">View Orders</a>
        </div>
      </section>
    </div>
  );
}
