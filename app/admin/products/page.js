'use client';

import { useEffect, useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    setUploading(true);

    try {
      // Image URL is already set by CldUploadWidget
      if (!formData.imageUrl) {
        throw new Error('Please upload an image');
      }

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
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>🎨 Manage Products</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => { e.target.style.background = '#db2777'; e.target.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.target.style.background = '#ec4899'; e.target.style.transform = 'scale(1)'; }}
        >
          {showForm ? '✕ Cancel' : '+ Add New Artwork'}
        </button>
      </div>

      {showForm && (
        <div style={{
          marginBottom: '2rem',
          maxWidth: '100%',
          background: 'white',
          padding: 'clamp(1rem, 5%, 2rem)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
        }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '700' }}>Add New Artwork</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              ></textarea>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>Image</label>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result) => {
                  setFormData((prev) => ({ ...prev, imageUrl: result.info.secure_url }));
                }}
                options={{
                  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
                  maxFileSize: 5242880,
                  clientAllowedFormats: ['image'],
                }}
              >
                {({ open }) => (
                  <div>
                    <button
                      type="button"
                      onClick={() => open()}
                      style={{
                        width: '100%',
                        padding: '2rem',
                        border: '2px dashed #ec4899',
                        borderRadius: '8px',
                        background: '#fce7f3',
                        color: '#be185d',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#db2777';
                        e.target.style.background = '#fbcfe8';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#ec4899';
                        e.target.style.background = '#fce7f3';
                      }}
                    >
                      📸 Click to upload or drag image here
                    </button>
                  </div>
                )}
              </CldUploadWidget>
              {formData.imageUrl && (
                <p style={{ fontSize: '0.85rem', color: '#ec4899', marginTop: '0.5rem', fontWeight: '500' }}>✓ Image selected: {formData.imageUrl.split('/').pop()}</p>
              )}
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>Max 5MB. JPG, PNG, WebP, or GIF.</p>
            </div>

            <button 
              type="submit"
              disabled={uploading}
              style={{
                gridColumn: '1 / -1',
                padding: '1rem',
                background: uploading ? '#cbd5e1' : '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => !uploading && (e.target.style.background = '#db2777', e.target.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => !uploading && (e.target.style.background = '#ec4899', e.target.style.transform = 'scale(1)')}
            >
              {uploading ? '⏳ Uploading...' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700', color: '#0f172a' }}>Products ({products?.length || 0})</h2>
      <div style={{ 
        overflowX: 'auto', 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.95rem',
          minWidth: '500px'
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
                  <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '500' }}>{product.title}</td>
                  <td style={{ padding: '1rem', color: '#ec4899', fontWeight: '700' }}>${(product.price / 100).toFixed(2)}</td>
                  <td style={{ padding: '1rem', color: '#0f172a' }}>{product.stock}</td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{new Date(product.created_at).toLocaleDateString()}</td>
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
