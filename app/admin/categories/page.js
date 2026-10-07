'use client';

import { useEffect, useState } from 'react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', sortOrder: '0' });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load collections');
      }

      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Failed to fetch collections:', fetchError);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: '', description: '', sortOrder: '0' });
    setEditingId(null);
    setError('');
  }

  function startEdit(category) {
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: String(category.sort_order ?? 0),
    });
    setEditingId(category.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const saved = await res.json();

      if (!res.ok) {
        throw new Error(saved.error || 'Could not save collection');
      }

      await fetchCategories();
      resetForm();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const warning = category.product_count > 0
      ? `Delete "${category.name}"? The ${category.product_count} piece(s) in it will stay, but become uncategorised.`
      : `Delete "${category.name}"?`;

    if (!confirm(warning)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not delete collection');
      }

      setCategories((current) => current.filter((item) => item.id !== category.id));

      if (editingId === category.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-section-head">
        <div>
          <h2>Collections</h2>
          <p className="dashboard-subtle">
            Group artwork into collections like Flowers or Horses. Each one gets its own
            description and appears as a filter on the storefront.
          </p>
        </div>
      </div>

      <section className="dashboard-panel dashboard-form-card">
        <div className="dashboard-section-head">
          <h2>{editingId ? 'Edit Collection' : 'Add Collection'}</h2>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="dashboard-form-grid">
          <div className="dashboard-field">
            <label htmlFor="category-name">Name</label>
            <input
              id="category-name"
              className="dashboard-input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Flowers"
              required
            />
          </div>

          <div className="dashboard-field">
            <label htmlFor="category-sort">Display Order</label>
            <input
              id="category-sort"
              className="dashboard-input"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              placeholder="0"
            />
            <p className="dashboard-subtle">Lower numbers appear first on the storefront.</p>
          </div>

          <div className="dashboard-field wide">
            <label htmlFor="category-description">Description</label>
            <textarea
              id="category-description"
              className="dashboard-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Shown to shoppers when they filter to this collection."
            />
          </div>

          <div className="dashboard-field wide">
            <div className="dashboard-mobile-actions">
              <button type="submit" className="checkout-button" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Collection'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="dashboard-link-button subtle">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>All Collections ({categories.length})</h2>
        </div>

        {categories.length === 0 ? (
          <div className="dashboard-panel dashboard-empty">
            <p>No collections yet. Add one above to start grouping artwork.</p>
          </div>
        ) : (
          <>
            <div className="dashboard-table-wrap dashboard-table-desktop">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Artwork</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="dashboard-table-secondary">{category.sort_order}</td>
                      <td className="dashboard-table-primary">{category.name}</td>
                      <td className="dashboard-table-secondary">{category.description || '—'}</td>
                      <td className="dashboard-table-primary">{category.product_count}</td>
                      <td>
                        <div className="dashboard-mobile-actions">
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            className="dashboard-link-button accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
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

            <div className="dashboard-mobile-list">
              {categories.map((category) => (
                <div key={category.id} className="dashboard-panel dashboard-mobile-card">
                  <div className="dashboard-mobile-title">{category.name}</div>
                  <div className="dashboard-mobile-row">
                    <span>Order</span>
                    <strong>{category.sort_order}</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Artwork</span>
                    <strong>{category.product_count}</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Description</span>
                    <strong>{category.description || '—'}</strong>
                  </div>
                  <div className="dashboard-mobile-actions">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="dashboard-link-button accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="dashboard-link-button danger"
                    >
                      Delete
                    </button>
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
