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
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="grid grid-2">
        <div className="card">
          <div className="card-content">
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Total Orders</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#6366f1' }}>
              {stats.totalOrders}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Total Revenue</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              ${(stats.totalRevenue / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Products Listed</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {stats.totalProducts}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Pending Orders</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
              {stats.pendingOrders}
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Quick Actions</h2>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a href="/admin/products" className="btn">Add New Artwork</a>
        <a href="/admin/orders" className="btn btn-secondary">View All Orders</a>
      </div>
    </div>
  );
}
