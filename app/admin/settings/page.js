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
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1>Settings</h1>

      {/* Add Admin Form */}
      <div className="card" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
        <div className="card-content">
          <h2>Add New Admin</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleAddAdmin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-block">
              + Add Admin
            </button>
          </form>
        </div>
      </div>

      {/* Admins List */}
      <div className="card">
        <div className="card-content">
          <h2>Existing Admins ({admins.length})</h2>

          {admins.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No admins yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Created</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>{admin.email}</td>
                    <td style={{ padding: '1rem' }}>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-small btn-error"
                        onClick={() => deleteAdmin(admin.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
