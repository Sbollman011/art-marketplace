'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getStatusClass(status) {
  if (status === 'paid') return 'is-paid';
  if (status === 'shipped') return 'is-shipped';
  if (status === 'completed') return 'is-completed';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

function getStatusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'shipped') return 'Shipped';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, spent: 0, shipped: 0 });
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem('customerName');
    const email = localStorage.getItem('customerEmail');
    if (!email) {
      router.push('/login');
      return;
    }
    setCustomerName(name || '');
    setCustomerEmail(email);
    fetchOrders();
  }, [router]);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('customerToken');
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setOrders(data.orders || []);

      // Calculate stats
      const totalOrders = data.orders?.length || 0;
      const totalSpent = data.orders?.reduce((sum, o) => sum + o.total, 0) || 0;
      const shippedOrders = data.orders?.filter(o => o.status === 'shipped' || o.status === 'completed').length || 0;

      setStats({
        total: totalOrders,
        spent: totalSpent,
        shipped: shippedOrders,
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
    router.push('/');
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Use at least 8 characters for your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('customerToken');
      const res = await fetch('/api/customer/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not update password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully.');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="account-page">
      <div className="dashboard-workspace">
        <div className="dashboard-section-head">
          <div>
            <h2>My Account</h2>
            <p className="dashboard-subtle">Signed in as {customerEmail}</p>
          </div>
          <div className="dashboard-header-actions">
            <button onClick={handleLogout} className="dashboard-link-button danger">Logout</button>
          </div>
        </div>

        <div className="dashboard-kpi-grid">
          <div className="dashboard-kpi-card accent-rust">
            <label>Total Orders</label>
            <strong>{stats.total}</strong>
          </div>
          <div className="dashboard-kpi-card accent-amber">
            <label>Total Spent</label>
            <strong>${(stats.spent / 100).toFixed(2)}</strong>
          </div>
          <div className="dashboard-kpi-card accent-green">
            <label>Delivered</label>
            <strong>{stats.shipped}</strong>
          </div>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2>Order History</h2>
            <p className="dashboard-subtle">Review recent purchases and shipping status.</p>
          </div>

          {orders.length === 0 ? (
            <div className="dashboard-panel" style={{ textAlign: 'center' }}>
              <p className="dashboard-subtle">No orders yet.</p>
              <a href="/" className="dashboard-link-button accent">Start Shopping</a>
            </div>
          ) : (
            <>
              <div className="dashboard-table-wrap dashboard-table-desktop">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="dashboard-table-primary">#{order.id}</td>
                        <td className="dashboard-table-secondary">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="dashboard-table-primary">{order.items?.filter((item) => item.title).length || 0} item(s)</td>
                        <td className="dashboard-table-primary">${(order.total / 100).toFixed(2)}</td>
                        <td>
                          <span className={`dashboard-status-badge ${getStatusClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
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
                      <span>Date</span>
                      <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
                    </div>
                    <div className="dashboard-mobile-row">
                      <span>Items</span>
                      <strong>{order.items?.filter((item) => item.title).length || 0} item(s)</strong>
                    </div>
                    <div className="dashboard-mobile-row">
                      <span>Total</span>
                      <strong>${(order.total / 100).toFixed(2)}</strong>
                    </div>
                    <div className="dashboard-mobile-row">
                      <span>Status</span>
                      <span className={`dashboard-status-badge ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="dashboard-panel dashboard-form-card">
          <div className="dashboard-section-head">
            <h2>Change Password</h2>
            <p className="dashboard-subtle">Update the password for this customer account.</p>
          </div>

          {passwordError && <div className="auth-alert error">{passwordError}</div>}
          {passwordSuccess && <div className="auth-alert success">{passwordSuccess}</div>}

          <form onSubmit={handlePasswordChange} className="dashboard-form-grid">
            <div className="dashboard-field">
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                className="dashboard-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
              />
            </div>
            <div className="dashboard-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                className="dashboard-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>
            <div className="dashboard-field">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                className="dashboard-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                minLength={8}
                required
              />
            </div>
            <div className="dashboard-field wide">
              <button type="submit" className="checkout-button" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
