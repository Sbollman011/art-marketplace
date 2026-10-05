'use client';

import { useEffect, useState } from 'react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    stock: '1',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No admin token found');
        setProducts([]);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status}`);
      }

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: Math.round(parseFloat(formData.price) * 100),
          imageUrl: formData.imageUrl,
          stock: parseInt(formData.stock),
        }),
      });

      if (res.ok) {
        const newProduct = await res.json();
        setProducts([newProduct, ...products]);
        setFormData({ title: '', description: '', price: '', imageUrl: '', stock: '1' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '800' }}>🎨 Manage Products</h1>
      
      <button 
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: '2rem',
          padding: '0.75rem 1.5rem',
          background: '#ec4899',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.target.style.background = '#db2777'; e.target.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.target.style.background = '#ec4899'; e.target.style.transform = 'scale(1)'; }}
      >
        {showForm ? '✕ Cancel' : '+ Add New Artwork'}
      </button>

      {showForm && (
        <div style={{
          marginBottom: '2rem',
          maxWidth: '600px',
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>Add New Artwork</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>

            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Create Product
            </button>
          </form>
        </div>
      )}

      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>Products ({products?.length || 0})</h2>
      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.95rem'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>Title</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>Price</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>Stock</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem', color: '#0f172a' }}>{product.title}</td>
                  <td style={{ padding: '1rem', color: '#ec4899', fontWeight: '600' }}>${(product.price / 100).toFixed(2)}</td>
                  <td style={{ padding: '1rem', color: '#0f172a' }}>{product.stock}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(product.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No products yet. Add one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
