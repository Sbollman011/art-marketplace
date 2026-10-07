'use client';

import { useEffect, useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    stock: '1',
    widthIn: '',
    heightIn: '',
    depthIn: '',
  });
  const [bulkText, setBulkText] = useState('');

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
      const res = await fetch(
        editingId ? `/api/admin/products/${editingId}` : '/api/admin/products',
        {
          method: editingId ? 'PATCH' : 'POST',
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
            widthIn: formData.widthIn,
            heightIn: formData.heightIn,
            depthIn: formData.depthIn,
          }),
        }
      );

      const saved = await res.json();

      if (!res.ok) {
        throw new Error(saved.error || 'Failed to save product');
      }

      setProducts((prev) =>
        editingId ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
      );
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  function parseBulkLine(line) {
    const [title = '', price = '', stock = '1', description = '', imageUrl = '', width = '', height = '', depth = ''] = line.split('|').map((part) => part.trim());

    if (!title || !price) {
      return null;
    }

    const numericPrice = Number.parseFloat(price.replace(/[^0-9.]/g, ''));

    if (Number.isNaN(numericPrice)) {
      return null;
    }

    const numericStock = Number.parseInt(stock, 10);

    return {
      title,
      price: Math.round(numericPrice * 100),
      stock: Number.isNaN(numericStock) ? 1 : numericStock,
      description,
      imageUrl,
      widthIn: width,
      heightIn: height,
      depthIn: depth,
    };
  }

  async function handleBulkSubmit(e) {
    e.preventDefault();

    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    const productsToCreate = lines.map(parseBulkLine).filter(Boolean);

    if (productsToCreate.length === 0) {
      alert('Add at least one line in the format: Title | Price | Stock | Description | Image URL');
      return;
    }

    setBulkUploading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: productsToCreate }),
      });

      const saved = await res.json();

      if (!res.ok) {
        throw new Error(saved.error || 'Failed to import products');
      }

      setProducts((prev) => [...saved, ...prev]);
      setBulkText('');
      setShowBulkForm(false);
    } catch (error) {
      console.error('Failed to bulk import products:', error);
      alert('Error: ' + error.message);
    } finally {
      setBulkUploading(false);
    }
  }

  function resetForm() {
    setFormData({ title: '', description: '', price: '', imageUrl: '', stock: '1', widthIn: '', heightIn: '', depthIn: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(product) {
    setFormData({
      title: product.title,
      description: product.description || '',
      price: (product.price / 100).toFixed(2),
      imageUrl: product.image_url || '',
      stock: String(product.stock ?? 0),
      widthIn: product.width_in != null ? String(product.width_in) : '',
      heightIn: product.height_in != null ? String(product.height_in) : '',
      depthIn: product.depth_in != null ? String(product.depth_in) : '',
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (editingId === product.id) resetForm();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Error: ' + error.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-section-head">
        <div>
          <h2>Products</h2>
          <p className="dashboard-subtle">Manage artwork listings, pricing, and stock.</p>
        </div>
        <div className="dashboard-header-actions">
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className={`dashboard-link-button${showForm ? ' subtle' : ' accent'}`}
          >
            {showForm ? 'Cancel' : 'Add Artwork'}
          </button>
          <button
            onClick={() => {
              setShowBulkForm((open) => !open);
              if (showForm) {
                resetForm();
              }
            }}
            className={`dashboard-link-button${showBulkForm ? ' subtle' : ' accent'}`}
          >
            {showBulkForm ? 'Close Bulk Add' : 'Bulk Add'}
          </button>
        </div>
      </div>

      {showBulkForm && (
        <section className="dashboard-panel dashboard-form-card">
          <div className="dashboard-section-head">
            <h2>Bulk Add Artwork</h2>
            <p className="dashboard-subtle">One artwork per line using: Title | Price | Stock | Description | Image URL | Width | Height | Depth</p>
          </div>

          <form onSubmit={handleBulkSubmit} className="dashboard-form-grid">
            <div className="dashboard-field wide">
              <label htmlFor="bulk-products">Artwork list</label>
              <textarea
                id="bulk-products"
                className="dashboard-textarea"
                rows="10"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Golden Hour | 120 | 2 | Warm abstract canvas | https://... | 8 | 12 | 1.5\nCity Lines | 95 | 4 | Ink on paper | https://... | 11 | 14 | 0.25"}
              />
              <p className="dashboard-subtle">
                Price is in dollars. Stock defaults to 1 if blank. Width, height, and depth are in
                inches and only affect shipping estimates.
              </p>
            </div>

            <div className="dashboard-field wide">
              <button type="submit" disabled={bulkUploading} className="checkout-button">
                {bulkUploading ? 'Importing...' : 'Import Artwork'}
              </button>
            </div>
          </form>
        </section>
      )}

      {showForm && (
        <section className="dashboard-panel dashboard-form-card">
          <div className="dashboard-section-head">
            <h2>{editingId ? 'Edit Artwork' : 'Add New Artwork'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="dashboard-form-grid">
            <div className="dashboard-field wide">
              <label htmlFor="product-title">Title</label>
              <input
                id="product-title"
                className="dashboard-input"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="dashboard-field wide">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                className="dashboard-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="dashboard-field">
              <label htmlFor="product-price">Price ($)</label>
              <input
                id="product-price"
                className="dashboard-input"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="dashboard-field">
              <label htmlFor="product-stock">Stock</label>
              <input
                id="product-stock"
                className="dashboard-input"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>

            <div className="dashboard-dimension-row">
              <div className="dashboard-dimension-inputs">
                <div className="dashboard-field">
                  <label htmlFor="product-width">Width (in)</label>
                  <input
                    id="product-width"
                    className="dashboard-input"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.widthIn}
                    onChange={(e) => setFormData({ ...formData, widthIn: e.target.value })}
                    placeholder="8"
                  />
                </div>

                <div className="dashboard-field">
                  <label htmlFor="product-height">Height (in)</label>
                  <input
                    id="product-height"
                    className="dashboard-input"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.heightIn}
                    onChange={(e) => setFormData({ ...formData, heightIn: e.target.value })}
                    placeholder="12"
                  />
                </div>

                <div className="dashboard-field">
                  <label htmlFor="product-depth">Depth (in)</label>
                  <input
                    id="product-depth"
                    className="dashboard-input"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.depthIn}
                    onChange={(e) => setFormData({ ...formData, depthIn: e.target.value })}
                    placeholder="0.25"
                  />
                </div>
              </div>
              <p className="dashboard-subtle">
                Used for shipping estimates. Depth of 0.5&quot; or less ships flat in a rigid mailer
                (works on paper); anything thicker ships boxed (stretched canvas). Blank depth is
                treated as boxed, and blank width/height fall back to the 8x12 rate.
              </p>
            </div>

            <div className="dashboard-field wide">
              <label>Image</label>
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
                  <button type="button" onClick={() => open()} className="dashboard-upload-trigger">
                    Select or drop artwork image
                  </button>
                )}
              </CldUploadWidget>
              {formData.imageUrl && (
                <p className="dashboard-subtle">Selected: {formData.imageUrl.split('/').pop()}</p>
              )}
              <p className="dashboard-subtle">Max 5MB. JPG, PNG, WebP, or GIF.</p>
            </div>

            <div className="dashboard-field wide">
              <button type="submit" disabled={uploading} className="checkout-button">
                {uploading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Products ({products?.length || 0})</h2>
          <p className="dashboard-subtle">Visual inventory with pricing and stock at a glance.</p>
        </div>

        {Array.isArray(products) && products.length > 0 ? (
          <>
            <div className="dashboard-table-wrap dashboard-table-desktop">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="dashboard-thumb" />
                        ) : (
                          <div className="dashboard-thumb dashboard-thumb-placeholder">No image</div>
                        )}
                      </td>
                      <td className="dashboard-table-primary">{product.title}</td>
                      <td className="dashboard-table-primary">${(product.price / 100).toFixed(2)}</td>
                      <td className="dashboard-table-secondary">{product.stock > 0 ? product.stock : 'Sold out'}</td>
                      <td className="dashboard-table-secondary">{new Date(product.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="dashboard-mobile-actions">
                          <button onClick={() => startEdit(product)} className="dashboard-link-button subtle">Edit</button>
                          <button onClick={() => handleDelete(product)} className="dashboard-link-button danger">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-mobile-list">
              {products.map((product) => (
                <div key={product.id} className="dashboard-panel dashboard-mobile-card">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="dashboard-thumb dashboard-thumb-lg" />
                  ) : (
                    <div className="dashboard-thumb dashboard-thumb-lg dashboard-thumb-placeholder">No image</div>
                  )}
                  <div className="dashboard-mobile-title">{product.title}</div>
                  <div className="dashboard-mobile-row">
                    <span>Price</span>
                    <strong>${(product.price / 100).toFixed(2)}</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Stock</span>
                    <strong>{product.stock > 0 ? product.stock : 'Sold out'}</strong>
                  </div>
                  <div className="dashboard-mobile-row">
                    <span>Created</span>
                    <strong>{new Date(product.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div className="dashboard-mobile-actions">
                    <button onClick={() => startEdit(product)} className="dashboard-link-button subtle">Edit</button>
                    <button onClick={() => handleDelete(product)} className="dashboard-link-button danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="dashboard-empty">
            <p>No products yet. Add one to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}
