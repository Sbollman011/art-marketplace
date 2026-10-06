'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignUp ? '/api/signup' : '/api/login';
      const body = isSignUp
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isSignUp ? 'Sign up failed' : 'Login failed'));
      }

      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerEmail');
      localStorage.removeItem('customerName');

      // Store appropriate tokens
      if (data.adminToken) {
        localStorage.setItem('adminToken', data.adminToken);
        localStorage.setItem('adminEmail', data.adminEmail);
      }

      if (data.customerToken) {
        localStorage.setItem('customerToken', data.customerToken);
        localStorage.setItem('customerEmail', data.customerEmail);
        localStorage.setItem('customerName', data.customerName);
      }

      // Route based on what they are
      if (data.isAdmin && !data.isCustomer) {
        // Admin only → go to admin
        router.push('/admin');
      } else if (data.isCustomer) {
        // Customer (with or without admin) → go to customer
        router.push('/customer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-topbar">
        <a href="/" className="auth-brand">
          <h1>Gabriel</h1>
          <p>Contemporary Art</p>
        </a>
      </div>

      <div className="auth-shell-inner">
        <div className="auth-copy">
          <h2>{isSignUp ? 'Collect the work you want to live with.' : 'Sign in to manage orders and purchases.'}</h2>
          <p>
            {isSignUp
              ? 'Create a customer account to track purchases, revisit pieces, and move through checkout without friction.'
              : 'Use one account for the collector view, and if you are an admin, the studio dashboard stays one tap away.'}
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3>{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
            <p>{isSignUp ? 'Join the studio mailing list and order history.' : 'Access your account and recent activity.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-alert error">{error}</div>}

            {isSignUp && (
              <div className="auth-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  className="auth-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="checkout-button">
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
            </button>

            <div className="auth-card-footer">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="inline-action"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setName('');
                }}
              >
                {isSignUp ? 'Login here' : 'Sign up here'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
