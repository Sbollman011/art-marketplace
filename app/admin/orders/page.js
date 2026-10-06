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
      setOrders(sortOrders(data));
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
        setOrders((current) => sortOrders(current.map((o) => (o.id === orderId ? updated : o))));
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm('Delete this order permanently? This also removes its order items and cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete order');
      }

      setOrders((current) => current.filter((order) => order.id !== orderId));
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert(error.message);
    }
  }

  function sortOrders(list) {
    const orderPriority = {
      paid: 0,
      pending: 1,
      shipped: 2,
      completed: 3,
      cancelled: 4,
    };

    return [...(list || [])].sort((left, right) => {
      const leftPriority = orderPriority[left.status] ?? 9;
      const rightPriority = orderPriority[right.status] ?? 9;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return new Date(right.created_at) - new Date(left.created_at);
    });
  }

  const orderSections = [
    {
      id: 'ready-to-fulfill',
      title: 'Ready to Fulfill',
      description: 'Paid orders are the ones you should pack and ship next.',
      emptyLabel: 'No paid orders waiting on fulfillment.',
      orders: orders.filter((order) => order.status === 'paid'),
    },
    {
      id: 'awaiting-payment',
      title: 'Awaiting Payment',
      description: 'These orders are still pending and do not need fulfillment yet.',
      emptyLabel: 'No orders waiting on payment.',
      orders: orders.filter((order) => order.status === 'pending'),
    },
    {
      id: 'shipped',
      title: 'Shipped',
      description: 'Orders that are already in transit.',
      emptyLabel: 'No shipped orders yet.',
      orders: orders.filter((order) => order.status === 'shipped'),
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Closed orders that are finished and archived.',
      emptyLabel: 'No completed orders yet.',
      orders: orders.filter((order) => order.status === 'completed'),
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      description: 'Orders that were cancelled or voided.',
      emptyLabel: 'No cancelled orders.',
      orders: orders.filter((order) => order.status === 'cancelled'),
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', background: 'var(--dark-bg)', color: '#cbd5e1' }}><p>⏳ Loading...</p></div>;
  }

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-section-head">
        <div>
          <h2>Orders</h2>
          <p className="dashboard-subtle">Update order states and move items through fulfillment.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="dashboard-empty">
          <p>No orders yet.</p>
        </div>
      ) : (
        orderSections.map((section) => (
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
              <div className="dashboard-table-wrap dashboard-table-desktop">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Email</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="dashboard-table-primary">#{order.id}</td>
                        <td className="dashboard-table-primary">{order.customer_name}</td>
                        <td>
                          <div className="dashboard-order-items-preview">
                            {(order.items || []).slice(0, 2).map((item) => (
                              <div key={item.id} className="dashboard-order-item-preview">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.title} className="dashboard-thumb dashboard-thumb-sm" />
                                ) : (
                                  <div className="dashboard-thumb dashboard-thumb-sm dashboard-thumb-placeholder">Art</div>
                                )}
                                <div>
                                  <div className="dashboard-table-primary">{item.title}</div>
                                  <div className="dashboard-table-secondary">Qty {item.quantity}</div>
                                </div>
                              </div>
                            ))}
                            {(order.items || []).length > 2 && (
                              <div className="dashboard-table-secondary">+{order.items.length - 2} more</div>
                            )}
                          </div>
                        </td>
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
                          <div className="dashboard-mobile-actions">
                            <a href={`/admin/orders/${order.id}`} className="dashboard-link-button accent">View</a>
                            <button
                              type="button"
                              onClick={() => deleteOrder(order.id)}
                              className="dashboard-link-button danger"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
