'use client';

import { useEffect, useState } from 'react';

function getStatusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'shipped') return 'Shipped';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function getStatusClass(status) {
  if (status === 'paid') return 'is-paid';
  if (status === 'shipped') return 'is-shipped';
  if (status === 'completed') return 'is-completed';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [orders, setOrders] = useState([]);
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
  setOrders(orders || []);

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
        setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
        setStats((current) => ({
          ...current,
          pendingOrders: updated.status === 'pending'
            ? current.pendingOrders
            : Math.max(0, current.pendingOrders - 1),
        }));
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }

  const pendingQueue = orders.filter((order) => order.status === 'pending').slice(0, 5);

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
        <div className="dashboard-hero-copy">
          <h1>Dashboard</h1>
          <p className="dashboard-subtle">Orders, stock, and fulfillment status at a glance.</p>
        </div>
      </div>

      <section className="dashboard-showcase dashboard-showcase-admin">
        <div className="dashboard-showcase-main">
          <span className="dashboard-showcase-eyebrow">Operations</span>
          <h2>Orders and inventory in one working view.</h2>
          <p>Use this page to see what is pending, what has shipped, and what needs attention next.</p>
        </div>
        <div className="dashboard-showcase-side dashboard-summary">
          <label>Pending Orders</label>
          <strong>{stats.pendingOrders} need fulfillment</strong>
          <a href="/admin/orders#pending-orders" className="dashboard-link-button accent" style={{ marginTop: '0.75rem' }}>
            Open Queue
          </a>
        </div>
      </section>

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

      <section className="dashboard-section" id="pending-orders">
        <div className="dashboard-section-head">
          <h2>Pending Orders</h2>
          <p className="dashboard-subtle">These orders still need to be packed or shipped.</p>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="dashboard-panel dashboard-empty">
            <p>No pending orders right now.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingQueue.map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard-table-primary">#{order.id}</td>
                    <td>
                      <div className="dashboard-table-primary">{order.customer_name}</div>
                      <div className="dashboard-table-secondary">{order.customer_email}</div>
                    </td>
                    <td className="dashboard-table-primary">${(order.total / 100).toFixed(2)}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="dashboard-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <a href={`/admin/orders/${order.id}`} className="dashboard-link-button accent">Open</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
