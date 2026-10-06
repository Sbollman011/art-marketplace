'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicHeader from '../components/public-header';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const endpoint = isForgotPassword
        ? '/api/password-reset/request'
        : isSignUp
          ? '/api/signup'
          : '/api/login';
      const body = isForgotPassword
        ? { email }
        : isSignUp
          ? { email, password, name }
          : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isForgotPassword ? 'Could not send reset email' : isSignUp ? 'Sign up failed' : 'Login failed'));
      }

      if (isForgotPassword) {
        setNotice(data.message || 'If an account exists, a reset link has been sent.');
        setLoading(false);
        return;
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
        if (data.customerName && data.customerName !== 'undefined') {
          localStorage.setItem('customerName', data.customerName);
        } else {
          localStorage.removeItem('customerName');
        }
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

  function switchMode(nextMode) {
    setIsSignUp(nextMode === 'signup');
    setIsForgotPassword(nextMode === 'forgot');
    setError('');
    setNotice('');
    setPassword('');
    setName('');
  }

  return (
    <div className="auth-shell">
      <PublicHeader />

      <div className="auth-shell-inner">
        <div className="auth-copy">
          <h2>{isForgotPassword ? 'Reset access to your account.' : isSignUp ? 'Collect the work you want to live with.' : 'Sign in to manage orders and purchases.'}</h2>
          <p>
            {isForgotPassword
              ? 'Enter your email and we will send a reset link if an account exists.'
              : isSignUp
              ? 'Create a customer account to track purchases, revisit pieces, and move through checkout without friction.'
              : 'Use one account for the collector view, and if you are an admin, the studio dashboard stays one tap away.'}
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3>{isForgotPassword ? 'Forgot Password' : isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
            <p>{isForgotPassword ? 'We will email you a reset link.' : isSignUp ? 'Join the studio mailing list and order history.' : 'Access your account and recent activity.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-alert error">{error}</div>}
            {notice && <div className="auth-alert success">{notice}</div>}

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

            {!isForgotPassword && (
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
                {!isSignUp && (
                  <button type="button" className="inline-action auth-inline-link" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="checkout-button">
              {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Login'}
            </button>

            <div className="auth-card-footer">
              {isForgotPassword ? (
                <button type="button" className="inline-action" onClick={() => switchMode('login')}>
                  Back to login
                </button>
              ) : (
                <>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => switchMode(isSignUp ? 'login' : 'signup')}
                  >
                    {isSignUp ? 'Login here' : 'Sign up here'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
