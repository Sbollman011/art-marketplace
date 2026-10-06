'use client';

import { useEffect, useState } from 'react';

function getStatusClass(status) {
  if (status === 'paid') return 'is-paid';
  if (status === 'shipped') return 'is-shipped';
  if (status === 'completed') return 'is-completed';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

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
    <div className="dashboard-workspace">
      <div className="dashboard-hero">
        <div>
          <h1>Orders</h1>
          <p className="dashboard-subtle">Manage customer orders and shipping status.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="dashboard-empty">
          <p>No orders yet.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-table-wrap dashboard-table-desktop">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard-table-primary">#{order.id}</td>
                    <td className="dashboard-table-primary">{order.customer_name}</td>
                    <td className="dashboard-table-secondary">{order.customer_email}</td>
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
                      <a href={`/admin/orders/${order.id}`} className="dashboard-link-button accent">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dashboard-mobile-list">
            {orders.map((order) => (
              <div key={order.id} className="dashboard-panel dashboard-mobile-card">
                <div className="dashboard-mobile-title">Order #{order.id}</div>
                <div className="dashboard-mobile-row">
                  <span>Customer</span>
                  <strong>{order.customer_name}</strong>
                </div>
                <div className="dashboard-mobile-row">
                  <span>Email</span>
                  <strong>{order.customer_email}</strong>
                </div>
                <div className="dashboard-mobile-row">
                  <span>Total</span>
                  <strong>${(order.total / 100).toFixed(2)}</strong>
                </div>
                <div className="dashboard-mobile-row">
                  <span>Status</span>
                  <span className={`dashboard-status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
                </div>
                <div className="dashboard-mobile-actions">
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
                  <a href={`/admin/orders/${order.id}`} className="dashboard-link-button accent">View</a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
