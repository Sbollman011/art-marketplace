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
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1>Orders</h1>

      <table>
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
              <td>#{order.id}</td>
              <td>{order.customer_name}</td>
              <td>{order.customer_email}</td>
              <td>${(order.total / 100).toFixed(2)}</td>
              <td>
                <select 
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td>
                <a href={`/admin/orders/${order.id}`} className="btn btn-small">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
