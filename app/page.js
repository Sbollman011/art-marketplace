'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product) {
    setCart([...cart, product]);
  }

  function removeFromCart(index) {
    setCart(cart.filter((_, i) => i !== index));
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="gallery-page">
      {/* Premium Header */}
      <header className="gallery-header">
        <nav className="gallery-nav">
          <div className="gallery-nav-brand">
            <h1>🎨 Goodness Gracious Gabriel</h1>
            <p>Contemporary Art & Creative Expression</p>
          </div>
          <div className="gallery-nav-links">
            <a href="/login" className="gallery-btn gallery-btn-primary">👤 My Account</a>
            <a href="https://instagram.com/goodnessgraciousgabriel/" target="_blank" rel="noopener noreferrer" className="gallery-btn gallery-btn-instagram">📸 Follow</a>
          </div>
        </nav>
      </header>

      {/* Hero Section with Artwork */}
      <section className="gallery-hero">
        <img src="/images/01-portrait.jpg" alt="Goodness Gracious Gabriel Artwork" className="gallery-hero-img" />
        <div className="gallery-hero-overlay">
          <h2>Handcrafted Art by Gabriel Davis</h2>
          <p>Original paintings, drawings, and mixed media</p>
        </div>
      </section>
      {!showCheckout ? (
        <>
          {/* Gallery Section */}
          <section className="gallery-section">
            <div className="gallery-container">
              <div className="gallery-intro">
                <h2>Featured Works</h2>
                <p>Discover original pieces from Gabriel's studio</p>
              </div>

              {products.length === 0 ? (
                <div className="gallery-empty">
                  <p>No artworks available yet. Check back soon!</p>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>👉 Add products via the Admin Dashboard</p>
                </div>
              ) : (
                <div className="gallery-grid">
                  {products.map((product) => (
                    <div key={product.id} className="gallery-item">
                      <div className="gallery-item-image">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} />
                        ) : (
                          <div className="gallery-item-placeholder">
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="gallery-item-content">
                        <h3>{product.title}</h3>
                        <p className="gallery-item-description">{product.description}</p>
                        <div className="gallery-item-footer">
                          <span className="gallery-price">${(product.price / 100).toFixed(2)}</span>
                          <button 
                            className="gallery-add-btn"
                            onClick={() => addToCart(product)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Floating Cart */}
          {cart.length > 0 && (
            <div className="gallery-cart">
              <h3>🛒 Your Cart</h3>
              <p className="gallery-cart-count">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              <div className="gallery-cart-items">
                {cart.map((item, idx) => (
                  <div key={idx} className="gallery-cart-item">
                    <span>{item.title}</span>
                    <button className="gallery-cart-remove" onClick={() => removeFromCart(idx)}>×</button>
                  </div>
                ))}
              </div>
              <div className="gallery-cart-total">
                ${(total / 100).toFixed(2)}
              </div>
              <button className="gallery-checkout-btn" onClick={() => setShowCheckout(true)}>
                Proceed to Checkout
              </button>
            </div>
          )}
        </>
      ) : (
        <CheckoutPage cart={cart} total={total} onBack={() => setShowCheckout(false)} />
      )}

      {/* Footer */}
      <footer style={{ 
        marginTop: '4rem', 
        padding: '3rem 2rem', 
        background: 'var(--dark-bg)', 
        color: '#cbd5e1',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p style={{ marginBottom: '0.5rem' }}>© 2026 Goodness Gracious Gabriel. All rights reserved.</p>
        <p style={{ fontSize: '0.9rem' }}>Follow for updates: <a href="https://instagram.com/goodnessgraciousgabriel/" target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899', textDecoration: 'none', fontWeight: '600' }}>@goodnessgraciousgabriel</a></p>
      </footer>
    </div>
  );
}

function CheckoutPage({ cart, total, onBack }) {
  return (
    <section className="gallery-checkout-section">
      <div className="gallery-checkout-container">
        <button className="gallery-back-btn" onClick={onBack}>← Back to Gallery</button>
        <h2>Order Summary</h2>
        <CheckoutForm cart={cart} total={total} />
      </div>
    </section>
  );
}

function CheckoutForm({ cart, total }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create checkout session
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.id, price: item.price, quantity: 1, title: item.title })),
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const { Stripe } = await import('@stripe/stripe-js');
      const stripe = await Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      
      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      {error && <div className="checkout-error">{error}</div>}
      
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Phone (optional)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div style={{ 
        padding: '1rem',
        background: '#f0f9ff',
        borderRadius: '8px',
        marginBottom: '1rem',
        borderLeft: '4px solid #0ea5e9'
      }}>
        <strong>💳 Total: ${(total / 100).toFixed(2)}</strong>
      </div>

      <button type="submit" className="checkout-button" disabled={loading}>
        {loading ? 'Redirecting to Stripe...' : 'Proceed to Secure Checkout'}
      </button>
    </form>
  );
}

