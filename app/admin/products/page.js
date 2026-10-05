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
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
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
      <h1>Manage Products</h1>
      
      <button className="btn" onClick={() => setShowForm(!showForm)} style={{ marginBottom: '2rem' }}>
        {showForm ? 'Cancel' : '+ Add New Artwork'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
          <div className="card-content">
            <h2>Add New Artwork</h2>
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

              <button type="submit" className="btn btn-block">Create Product</button>
            </form>
          </div>
        </div>
      )}

      <h2>Products ({products.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.title}</td>
              <td>${(product.price / 100).toFixed(2)}</td>
              <td>{product.stock}</td>
              <td>{new Date(product.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
