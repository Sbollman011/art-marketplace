'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

function getStatusClass(status) {
  if (status === 'paid') return 'is-paid';
  if (status === 'shipped') return 'is-shipped';
  if (status === 'completed') return 'is-completed';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function deleteOrder() {
    const confirmed = window.confirm('Delete this order permanently? This also removes its order items and cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete order');
      }

      router.push('/admin/orders');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  useEffect(() => {
    async function fetchOrder() {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`/api/admin/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch order');
        }

        setOrder(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (error) {
    return (
      <div className="dashboard-workspace">
        <div className="dashboard-empty">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-section-head">
        <div>
          <h2>Order #{order.id}</h2>
          <p className="dashboard-subtle">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="dashboard-header-actions">
          <span className={`dashboard-status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
          <button type="button" onClick={deleteOrder} className="dashboard-link-button danger">Delete Order</button>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card accent-rust">
          <label>Customer</label>
          <strong>{order.customer_name}</strong>
        </div>
        <div className="dashboard-kpi-card accent-amber">
          <label>Subtotal</label>
          <strong>${((order.subtotal ?? order.total) / 100).toFixed(2)}</strong>
        </div>
        <div className="dashboard-kpi-card accent-slate">
          <label>Shipping</label>
          <strong>${((order.shipping_total || 0) / 100).toFixed(2)}</strong>
        </div>
        <div className="dashboard-kpi-card accent-green">
          <label>Tax</label>
          <strong>${((order.tax_total || 0) / 100).toFixed(2)}</strong>
        </div>
        <div className="dashboard-kpi-card accent-green">
          <label>Total</label>
          <strong>${(order.total / 100).toFixed(2)}</strong>
        </div>
      </div>

      <section className="dashboard-panel dashboard-section">
        <div className="dashboard-section-head">
          <h2>Customer Details</h2>
        </div>
        <div className="dashboard-form-grid">
          <div className="dashboard-summary">
            <label>Email</label>
            <strong>{order.customer_email}</strong>
          </div>
          <div className="dashboard-summary">
            <label>Phone</label>
            <strong>{order.customer_phone || 'Not provided'}</strong>
          </div>
          <div className="dashboard-summary">
            <label>Fulfillment</label>
            <strong>{order.delivery_method === 'pickup' ? 'Local pickup' : 'Ship'}</strong>
          </div>
          <div className="dashboard-summary wide">
            <label>Shipping Address</label>
            <strong>
              {order.delivery_method === 'pickup'
                ? 'Local pickup — arrange a time with the buyer'
                : order.shipping_address || 'No shipping address provided'}
            </strong>
          </div>
          <div className="dashboard-summary wide">
            <label>Order Notes</label>
            <strong>{order.order_notes || 'No notes provided'}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Items</h2>
        </div>
        <div className="dashboard-mobile-list" style={{ display: 'grid' }}>
          {(order.items || []).map((item) => (
            <div key={item.id} className="dashboard-panel dashboard-order-detail-item">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="dashboard-thumb dashboard-thumb-lg" />
              ) : (
                <div className="dashboard-thumb dashboard-thumb-lg dashboard-thumb-placeholder">No image</div>
              )}
              <div className="dashboard-summary">
                <label>Item</label>
                <strong>{item.title}</strong>
              </div>
              <div className="dashboard-mobile-row">
                <span>Quantity</span>
                <strong>{item.quantity}</strong>
              </div>
              <div className="dashboard-mobile-row">
                <span>Price</span>
                <strong>${(item.price_at_purchase / 100).toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}