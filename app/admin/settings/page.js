'use client';

import { useEffect, useState } from 'react';

export default function AdminSettings() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setError('Failed to load admins');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }

      setAdmins([data, ...admins]);
      setFormData({ email: '', password: '' });
      setSuccess(`✅ Admin ${data.email} added successfully!`);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAdmin(adminId) {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/admins?id=${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete admin');
      }

      setAdmins(admins.filter(a => a.id !== adminId));
      setSuccess('✅ Admin deleted');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><p style={{ color: '#64748b' }}>⏳ Loading...</p></div>;
  }

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-hero">
        <div>
          <h1>Settings</h1>
          <p className="dashboard-subtle">Manage admin users and access.</p>
        </div>
      </div>

      <section className="dashboard-panel dashboard-form-card">
        <div className="dashboard-section-head">
          <h2>Add Admin</h2>
        </div>
        {error && <div className="auth-alert error">{error}</div>}
        {success && <div className="auth-alert success">{success}</div>}
        <form onSubmit={handleAddAdmin} className="dashboard-form-grid">
          <div className="dashboard-field">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              className="dashboard-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="dashboard-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="dashboard-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>
          <div className="dashboard-field wide">
            <button type="submit" className="checkout-button">Add Admin User</button>
          </div>
        </form>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Existing Admins ({admins.length})</h2>
        </div>

        {admins.length === 0 ? (
          <div className="dashboard-empty">
            <p>No admins yet.</p>
          </div>
        ) : (
          <>
            <div className="dashboard-table-wrap dashboard-table-desktop">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="dashboard-table-primary">{admin.email}</td>
                      <td className="dashboard-table-secondary">{new Date(admin.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => deleteAdmin(admin.id)} className="dashboard-link-button danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-mobile-list">
              {admins.map((admin) => (
                <div key={admin.id} className="dashboard-panel dashboard-mobile-card">
                  <div className="dashboard-mobile-title">{admin.email}</div>
                  <div className="dashboard-mobile-row">
                    <span>Created</span>
                    <strong>{new Date(admin.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div className="dashboard-mobile-actions">
                    <button onClick={() => deleteAdmin(admin.id)} className="dashboard-link-button danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
