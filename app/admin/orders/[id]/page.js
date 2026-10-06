'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function getStatusClass(status) {
  if (status === 'paid') return 'is-paid';
  if (status === 'shipped') return 'is-shipped';
  if (status === 'completed') return 'is-completed';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="dashboard-hero">
        <div>
          <h1>Order #{order.id}</h1>
          <p className="dashboard-subtle">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="dashboard-header-actions">
          <span className={`dashboard-status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card accent-rust">
          <label>Customer</label>
          <strong>{order.customer_name}</strong>
        </div>
        <div className="dashboard-kpi-card accent-amber">
          <label>Total</label>
          <strong>${(order.total / 100).toFixed(2)}</strong>
        </div>
        <div className="dashboard-kpi-card accent-slate">
          <label>Items</label>
          <strong>{order.item_count}</strong>
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
          <div className="dashboard-summary wide">
            <label>Shipping Address</label>
            <strong>{order.shipping_address || 'No shipping address provided'}</strong>
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