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
    readyOrders: 0,
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
      const readyOrders = orders.filter((o) => o.status === 'paid').length;
      const pendingOrders = orders.filter((o) => o.status === 'pending').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        readyOrders,
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
        setOrders((current) => {
          const nextOrders = current.map((order) => (order.id === orderId ? updated : order));
          setStats((currentStats) => ({
            ...currentStats,
            totalRevenue: nextOrders.reduce((sum, order) => sum + (order.total || 0), 0),
            readyOrders: nextOrders.filter((order) => order.status === 'paid').length,
            pendingOrders: nextOrders.filter((order) => order.status === 'pending').length,
          }));
          return nextOrders;
        });
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }

  const readyQueue = orders.filter((order) => order.status === 'paid').slice(0, 5);
  const pendingQueue = orders.filter((order) => order.status === 'pending').slice(0, 5);
  const shippedQueue = orders.filter((order) => order.status === 'shipped').slice(0, 5);
  const completedQueue = orders.filter((order) => order.status === 'completed').slice(0, 5);
  const cancelledQueue = orders.filter((order) => order.status === 'cancelled').slice(0, 5);

  const orderSections = [
    {
      id: 'ready-to-fulfill',
      title: 'Ready to Fulfill',
      description: 'Paid orders are the ones you should pack and ship next.',
      emptyLabel: 'No paid orders waiting on fulfillment.',
      orders: readyQueue,
    },
    {
      id: 'awaiting-payment',
      title: 'Awaiting Payment',
      description: 'These orders are still pending and do not need fulfillment yet.',
      emptyLabel: 'No orders waiting on payment.',
      orders: pendingQueue,
    },
    {
      id: 'shipped',
      title: 'Shipped',
      description: 'Orders that are already in transit.',
      emptyLabel: 'No shipped orders yet.',
      orders: shippedQueue,
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Closed orders that are finished and archived.',
      emptyLabel: 'No completed orders yet.',
      orders: completedQueue,
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      description: 'Orders that were cancelled or voided.',
      emptyLabel: 'No cancelled orders.',
      orders: cancelledQueue,
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><p style={{ color: '#64748b' }}>⏳ Loading...</p></div>;
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#ec4899' },
    { label: 'Total Revenue', value: `$${(stats.totalRevenue / 100).toFixed(2)}`, icon: '💰', color: '#10b981' },
    { label: 'Products Listed', value: stats.totalProducts, icon: '🎨', color: '#f59e0b' },
    { label: 'Ready to Fulfill', value: stats.readyOrders, icon: '📮', color: '#8f2d1f' },
    { label: 'Awaiting Payment', value: stats.pendingOrders, icon: '⏳', color: '#ef4444' },
  ];

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-section-head">
        <div>
          <h2>Dashboard</h2>
          <p className="dashboard-subtle">Orders, stock, and fulfillment status at a glance.</p>
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

      {orderSections.map((section) => (
        <section key={section.id} className="dashboard-section" id={section.id}>
          <div className="dashboard-section-head">
            <h2>{section.title} ({section.orders.length})</h2>
            <p className="dashboard-subtle">{section.description}</p>
          </div>

          {section.orders.length === 0 ? (
            <div className="dashboard-panel dashboard-empty">
              <p>{section.emptyLabel}</p>
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
                  {section.orders.map((order) => (
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
      ))}
    </div>
  );
}
