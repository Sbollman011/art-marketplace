'use client';

import { useEffect, useState } from 'react';
import PublicHeader from './components/public-header';

const CART_STORAGE_KEY = 'ggg-cart';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickCartOpen, setQuickCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cartNotice, setCartNotice] = useState('');
  const [cartNoticeTone, setCartNoticeTone] = useState('success');
  const [isCartHighlighted, setIsCartHighlighted] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    fetchProducts();

    // A piece can sell while this tab sits open, so refresh availability when
    // the shopper comes back to it.
    function refreshOnFocus() {
      fetchProducts();
    }

    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, []);

  // Restore the cart so a refresh, or a trip to Contact and back, does not empty it.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;

      if (Array.isArray(parsed)) {
        setCart(parsed);
      }
    } catch (storageError) {
      console.error('Could not restore saved cart:', storageError);
    }

    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) {
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartLoaded]);

  // A restored cart can hold pieces that sold in the meantime. Reconcile against
  // live stock rather than letting the shopper reach checkout and be refused.
  useEffect(() => {
    if (!cartLoaded || products.length === 0 || cart.length === 0) {
      return;
    }

    const takenByProduct = new Map();
    const stillAvailable = [];

    for (const item of cart) {
      const product = products.find((candidate) => candidate.id === item.id);

      if (!product) {
        continue;
      }

      const alreadyTaken = takenByProduct.get(product.id) || 0;

      if (alreadyTaken >= product.stock) {
        continue;
      }

      takenByProduct.set(product.id, alreadyTaken + 1);
      stillAvailable.push(product);
    }

    if (stillAvailable.length !== cart.length) {
      setCart(stillAvailable);
      setCartNotice('Some pieces in your cart are no longer available and were removed.');
      setCartNoticeTone('warning');
    }
  }, [products, cart, cartLoaded]);

  useEffect(() => {
    if (!cartNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCartNotice('');
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [cartNotice]);

  useEffect(() => {
    if (!isCartHighlighted) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsCartHighlighted(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isCartHighlighted]);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(
        [...data].sort((left, right) => {
          const leftSoldOut = (left.stock ?? 0) <= 0;
          const rightSoldOut = (right.stock ?? 0) <= 0;

          if (leftSoldOut === rightSoldOut) {
            return 0;
          }

          return leftSoldOut ? 1 : -1;
        })
      );
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product) {
    const inCart = cart.filter((item) => item.id === product.id).length;
    if (inCart >= product.stock) {
      setCartNotice(`Only ${product.stock} available of ${product.title}.`);
      setCartNoticeTone('warning');
      setIsCartHighlighted(true);
      setQuickCartOpen(true);
      return;
    }
    setCart([...cart, product]);
    setCartNotice(`Added ${product.title} to your cart.`);
    setCartNoticeTone('success');
    setIsCartHighlighted(true);
    setCartOpen(true);
  }

  function removeFromCart(index) {
    setCart(cart.filter((_, i) => i !== index));
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  function renderCartPanel(onClose, variant = 'header') {
    return (
      <div className={`gallery-cart-panel${variant === 'quick' ? ' is-upward' : ''}`}>
        <div className="gallery-cart-panel-head">
          <h3>Your Cart</h3>
          <button
            className="gallery-cart-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <p className="gallery-cart-empty">Your cart is empty.</p>
        ) : (
          <>
            <div className="gallery-cart-items">
              {cart.map((item, idx) => (
                <div key={idx} className="gallery-cart-item">
                  <span>{item.title}</span>
                  <span className="gallery-cart-item-price">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                  <button
                    className="gallery-cart-remove"
                    onClick={() => removeFromCart(idx)}
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="gallery-cart-total">
              <span>Total</span>
              <strong>${(total / 100).toFixed(2)}</strong>
            </div>
            {/* The quick cart already shows its own Checkout Now button, so the
                panel would otherwise stack a second one directly on top of it. */}
            {variant !== 'quick' && (
              <button
                className="gallery-checkout-btn"
                onClick={() => {
                  onClose();
                  setShowCheckout(true);
                }}
              >
                Proceed to Checkout
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="gallery-page">
      <PublicHeader
        cartContent={(
          <div className="gallery-cart-wrap">
            <button
              className={`gallery-btn gallery-cart-toggle${isCartHighlighted ? ' is-highlighted' : ''}`}
              onClick={() => setCartOpen((open) => !open)}
              aria-expanded={cartOpen}
              aria-label={`Cart, ${cart.length} item${cart.length === 1 ? '' : 's'}`}
            >
              Cart
              {cart.length > 0 && <span className="gallery-cart-badge">{cart.length}</span>}
            </button>

            {cartNotice && <p className={`gallery-cart-notice is-${cartNoticeTone}`} aria-live="polite">{cartNotice}</p>}

            {cartOpen && renderCartPanel(() => setCartOpen(false))}
          </div>
        )}
      />

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
                  <p style={{ fontSize: '0.9rem', color: '#6f7886', marginTop: '1rem' }}>Add products through the admin dashboard.</p>
                </div>
              ) : (
                <div className="gallery-grid">
                  {products.map((product) => (
                    <div key={product.id} className="gallery-item">
                      <div className="gallery-item-image">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.title}
                            onClick={() => setSelectedImage(product.image_url)}
                            style={{ cursor: 'pointer' }}
                            title="Click to enlarge"
                          />
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
                            disabled={product.stock <= 0}
                          >
                            {product.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <CheckoutPage cart={cart} subtotal={total} onBack={() => setShowCheckout(false)} />
      )}

      {cart.length > 0 && !showCheckout && (
        <div className="gallery-quick-cart" aria-live="polite">
          <div className="gallery-quick-cart-copy">
            <span className="gallery-quick-cart-label">Ready to Checkout</span>
            <strong>{cart.length} item{cart.length === 1 ? '' : 's'} • ${(total / 100).toFixed(2)}</strong>
          </div>
          {cartNotice && (
            <p className={`gallery-quick-cart-notice is-${cartNoticeTone}`} aria-live="polite">
              {cartNotice}
            </p>
          )}
          <div className="gallery-quick-cart-actions">
            <button
              type="button"
              className="gallery-quick-cart-secondary"
              onClick={() => setQuickCartOpen((open) => !open)}
              aria-expanded={quickCartOpen}
            >
              View Cart
            </button>
            <button
              type="button"
              className="gallery-quick-cart-primary"
              onClick={() => {
                setQuickCartOpen(false);
                setShowCheckout(true);
              }}
            >
              Checkout Now
            </button>
          </div>
          {quickCartOpen && renderCartPanel(() => setQuickCartOpen(false), 'quick')}
        </div>
      )}

      <footer className="gallery-footer">
        <p>© 2026 Goodness Gracious Gabriel. All rights reserved.</p>
        <p>Follow for updates: <a href="https://instagram.com/goodnessgraciousgabriel/" target="_blank" rel="noopener noreferrer">@goodnessgraciousgabriel</a></p>
      </footer>

      {/* Image Enlargement Modal */}
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={selectedImage}
              alt="Enlarged artwork"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#a54a2a',
                color: '#fffaf2',
                border: 'none',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              title="Close (or click outside)"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutPage({ cart, subtotal, onBack }) {
  return (
    <section className="gallery-checkout-section">
      <div className="gallery-checkout-container">
        <button className="gallery-back-btn" onClick={onBack}>← Back to Gallery</button>
        <h2>Order Summary</h2>
        <CheckoutForm cart={cart} subtotal={subtotal} />
      </div>
    </section>
  );
}

function CheckoutForm({ cart, subtotal }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('ship');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerToken, setCustomerToken] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const isLoggedIn = Boolean(customerToken);

  // Totals are quoted by the server so the price shown here is always the same
  // math that creates the order and the Stripe session.
  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null);
      return undefined;
    }

    let cancelled = false;
    setQuoteLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((item) => ({ id: item.id, quantity: 1 })),
            shippingAddress,
            deliveryMethod,
          }),
        });

        const data = await res.json();

        if (!cancelled) {
          setQuote(res.ok ? data : null);
        }
      } catch (quoteError) {
        if (!cancelled) {
          setQuote(null);
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cart, shippingAddress, deliveryMethod]);

  useEffect(() => {
    const storedCustomerToken = localStorage.getItem('customerToken');
    const customerEmail = localStorage.getItem('customerEmail');
    const customerName = localStorage.getItem('customerName');

    setCustomerToken(storedCustomerToken || '');

    if (customerEmail) {
      setEmail(customerEmail);
    }

    if (customerName && customerName !== 'undefined' && customerName !== 'null') {
      setName(customerName);
    }

    if (!storedCustomerToken) {
      return undefined;
    }

    let cancelled = false;

    async function loadCustomerProfile() {
      try {
        const res = await fetch('/api/customer/profile', {
          headers: { Authorization: `Bearer ${storedCustomerToken}` },
        });

        // An expired or revoked token would otherwise leave the form claiming the
        // shopper is signed in while silently failing to prefill anything.
        if (res.status === 401) {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerEmail');
          localStorage.removeItem('customerName');

          if (!cancelled) {
            setCustomerToken('');
          }

          return;
        }

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (cancelled || !data.customer) {
          return;
        }

        if (data.customer.email) {
          setEmail(data.customer.email);
        }

        if (data.customer.name) {
          setName(data.customer.name);
        }

        if (data.customer.shippingAddress) {
          setShippingAddress(data.customer.shippingAddress);
        }
      } catch (profileError) {
        console.error('Failed to load customer profile:', profileError);
      }
    }

    loadCustomerProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (deliveryMethod === 'ship' && !shippingAddress.trim()) {
      setError('Shipping address is required');
      setLoading(false);
      return;
    }

    if (createAccount && !isLoggedIn && password.length < 8) {
      setError('Use at least 8 characters for your account password');
      setLoading(false);
      return;
    }

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
          createAccount,
          password: createAccount && !isLoggedIn ? password : null,
          shippingAddress: deliveryMethod === 'ship' ? shippingAddress.trim() : null,
          orderNotes: notes || null,
          deliveryMethod,
          customerToken,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('Stripe did not return a checkout URL');
      }

      if (data.customerToken) {
        localStorage.setItem('customerToken', data.customerToken);
        localStorage.setItem('customerEmail', data.customerEmail);
        if (data.customerName) {
          localStorage.setItem('customerName', data.customerName);
        }
      }

      // Stripe hosts the payment page; send the shopper straight there
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Before a destination is known the server falls back to a mid-country zone.
  // Showing that number would misstate the price, so hold it back until the
  // address can actually be read.
  const hasQuotedShipping = deliveryMethod === 'pickup' || Boolean(quote?.hasDestination);

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

      {isLoggedIn ? (
        <div className="form-group form-group-checkbox">
          <p className="checkout-helper-copy">
            You are already signed in. If you add a shipping address here, we will save it to your account automatically.
          </p>
        </div>
      ) : (
        <div className="form-group form-group-checkbox">
          <label className="checkout-checkbox-label">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => {
                setCreateAccount(e.target.checked);
                if (!e.target.checked) {
                  setPassword('');
                }
              }}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <span>Create an account with this order</span>
          </label>
          <p className="checkout-helper-copy">
            If this email already has an account, we will keep the shipping address you use here on file automatically.
          </p>
        </div>
      )}

      {createAccount && !isLoggedIn && (
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            minLength={8}
            required={createAccount}
          />
        </div>
      )}

      <div className="form-group">
        <label>Delivery Method</label>
        <div className="checkout-method-options">
          <label className={`checkout-method-option${deliveryMethod === 'ship' ? ' is-selected' : ''}`}>
            <span className="checkout-method-head">
              <input
                type="radio"
                name="deliveryMethod"
                value="ship"
                checked={deliveryMethod === 'ship'}
                onChange={() => setDeliveryMethod('ship')}
              />
              <span>Ship it</span>
            </span>
            <span className="checkout-method-note">Ships from Seattle, WA</span>
          </label>

          <label className={`checkout-method-option${deliveryMethod === 'pickup' ? ' is-selected' : ''}`}>
            <span className="checkout-method-head">
              <input
                type="radio"
                name="deliveryMethod"
                value="pickup"
                checked={deliveryMethod === 'pickup'}
                onChange={() => setDeliveryMethod('pickup')}
              />
              <span>Local pickup</span>
            </span>
            <span className="checkout-method-note">No shipping charge</span>
          </label>
        </div>
      </div>

      {deliveryMethod === 'ship' ? (
        <div className="form-group">
          <label>Shipping Address *</label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Street address, city, state, ZIP"
            rows="3"
            required
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <p className="checkout-helper-copy">
            All orders ship from Seattle, WA. If this email already belongs to an account, we will keep this address on file automatically.
          </p>
        </div>
      ) : (
        <div className="form-group">
          <div className="checkout-pickup-note">
            <strong>We will follow up by email to arrange pickup.</strong>
            <span>
              No shipping is charged. Add any preferred days or times in the notes below and the
              studio will confirm a time and place in Seattle.
            </span>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>{deliveryMethod === 'pickup' ? 'Pickup Notes (optional)' : 'Order Notes (optional)'}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            deliveryMethod === 'pickup'
              ? 'Preferred pickup days or times, or anything else the studio should know...'
              : 'Any special instructions or requests...'
          }
          rows="2"
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{
        padding: '1rem',
        background: 'rgba(198, 139, 69, 0.12)',
        borderRadius: '16px',
        marginBottom: '1rem',
        borderLeft: '4px solid #c68b45'
      }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <strong>Subtotal: ${((quote?.subtotal ?? subtotal) / 100).toFixed(2)}</strong>
          <strong>
            {deliveryMethod === 'pickup'
              ? 'Shipping: none (local pickup)'
              : hasQuotedShipping
                ? `Shipping: $${(quote.shipping / 100).toFixed(2)}`
                : 'Shipping: enter address to calculate'}
          </strong>
          <strong>Sales tax: calculated at payment</strong>
          <strong>💳 Due before tax: {hasQuotedShipping && quote ? `$${(quote.total / 100).toFixed(2)}` : '—'}</strong>
        </div>
        <p className="checkout-helper-copy" style={{ marginTop: '0.6rem' }}>
          {quoteLoading
            ? 'Updating totals...'
            : deliveryMethod === 'pickup'
              ? 'Sales tax is calculated on the secure payment page.'
              : quote?.hasDestination
                ? 'Shipping is estimated from Seattle, WA. Sales tax is calculated on the secure payment page.'
                : 'Enter your shipping address, including ZIP code, to calculate shipping.'}
        </p>
      </div>

      <button type="submit" className="checkout-button" disabled={loading}>
        {loading ? 'Redirecting to Stripe...' : 'Proceed to Secure Checkout'}
      </button>
    </form>
  );
}

