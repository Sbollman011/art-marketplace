'use client';

import { useEffect, useState } from 'react';

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
    <div>
      <header style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', color: 'white', padding: '2rem 1.5rem', marginBottom: '3rem' }}>
        <nav style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>🎨 Goodness Gracious Gabriel</h1>
            <p style={{ fontSize: '0.9rem', color: '#d1d5db' }}>Original Artwork & Creative Pieces</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/customer" style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#2563eb'} onMouseLeave={(e) => e.target.style.background = '#3b82f6'}>👤 Account</a>
            <a href="https://instagram.com/goodnessgraciousgabriel/" target="_blank" style={{ padding: '0.6rem 1.2rem', background: '#e1306c', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#c13584'} onMouseLeave={(e) => e.target.style.background = '#e1306c'}>📸 Instagram</a>
          </div>
        </nav>
      </header>
      
      {!showCheckout ? (
        <>
          {products.length > 0 && (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Featured Artwork</h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Explore Gabriel's unique collection</p>
            </div>
          )}
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div className="grid">
              {products.map((product) => (
                <div key={product.id} className="card">
                {product.image_url && (
                  <img src={product.image_url} alt={product.title} className="card-image" />
                )}
                <div className="card-content">
                  <h2 className="card-title">{product.title}</h2>
                  <p className="card-description">{product.description}</p>
                  <p className="card-price">${(product.price / 100).toFixed(2)}</p>
                  <button 
                    className="btn btn-block"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>

          {cart.length > 0 && (
            <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', left: 'auto', background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', minWidth: '280px', maxWidth: '95vw', zIndex: 1000 }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>🛒 Cart ({cart.length})</h3>
              <div style={{ marginBottom: '1rem', maxHeight: '200px', overflow: 'auto' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', marginBottom: '0.5rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                    <span style={{ flex: 1 }}>{item.title}</span>
                    <button className="btn btn-small btn-error" onClick={() => removeFromCart(idx)} style={{ marginLeft: '0.5rem' }}>×</button>
                  </div>
                ))}
              </div>
              <p style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '700', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                ${(total / 100).toFixed(2)}
              </p>
              <button className="btn btn-block btn-secondary" onClick={() => setShowCheckout(true)} style={{ marginBottom: '0.5rem' }}>
                Checkout
              </button>
              <button className="btn btn-block" style={{ background: '#e5e7eb', color: '#374151' }} onClick={() => setShowCheckout(false)}>
                Keep Shopping
              </button>
            </div>
          )}
        </>
      ) : (
        <CheckoutPage cart={cart} total={total} onBack={() => setShowCheckout(false)} />
      )}
    </div>
  );
}

function CheckoutPage({ cart, total, onBack }) {
  return (
    <div style={{ maxWidth: '600px' }}>
      <button className="btn btn-small" onClick={onBack}>← Back</button>
      <h2>Checkout</h2>
      <CheckoutForm cart={cart} total={total} />
    </div>
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
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      
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

      <div className="alert alert-info">
        💳 Total: ${(total / 100).toFixed(2)}
      </div>

      <button type="submit" className="btn btn-block btn-success" disabled={loading}>
        {loading ? 'Redirecting to Stripe...' : 'Proceed to Secure Checkout'}
      </button>
    </form>
  );
}

