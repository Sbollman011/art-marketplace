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
    <div>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>⚙️ Settings</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Manage admin users and system settings</p>
      </div>

      {/* Add Admin Form */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        padding: '2rem',
        marginBottom: '3rem',
        maxWidth: '600px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>➕ Add New Admin</h2>
        
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>❌ {error}</div>}
        {success && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>{success}</div>}

        <form onSubmit={handleAddAdmin} style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #ec4899 0%, #d946a6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 10px 20px rgba(236, 72, 153, 0.3)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
          >
            ➕ Add Admin User
          </button>
        </form>
      </div>

      {/* Admins List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>👥 Existing Admins ({admins.length})</h2>
        </div>

        {admins.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No admins yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(217, 70, 239, 0.05) 100%)' }}>
                  <th style={{ textAlign: 'left', padding: '1.5rem', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Email Address</th>
                  <th style={{ textAlign: 'left', padding: '1.5rem', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Created Date</th>
                  <th style={{ textAlign: 'right', padding: '1.5rem', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, idx) => (
                  <tr 
                    key={admin.id} 
                    style={{ 
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 0 ? 'white' : '#f8fafc',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fafc'}
                  >
                    <td style={{ padding: '1.5rem', color: '#0f172a', fontWeight: '500', fontSize: '0.95rem' }}>{admin.email}</td>
                    <td style={{ padding: '1.5rem', color: '#64748b', fontSize: '0.95rem' }}>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => deleteAdmin(admin.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.target.style.background = '#fecaca'; e.target.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.target.style.background = '#fee2e2'; e.target.style.transform = 'scale(1)'; }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
