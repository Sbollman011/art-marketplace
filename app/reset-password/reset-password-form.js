'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicHeader from '../components/public-header';

export default function ResetPasswordForm({ token }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not reset password');
      }

      setSubmitted(true);
      setMessage('Password updated. Redirecting to login...');
      window.setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <PublicHeader />

      <div className="auth-shell-inner">
        <div className="auth-copy">
          <h2>Choose a new password.</h2>
          <p>Use this one-time link to update your account password and get back to your orders.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3>Reset Password</h3>
            <p>Enter a new password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-alert error">{error}</div>}
            {message && <div className="auth-alert success">{message}</div>}
            {!token && <div className="auth-alert error">This reset link is missing its token. Request a new password reset email.</div>}

            <div className="auth-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                disabled={submitted || !token}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                className="auth-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                disabled={submitted || !token}
              />
            </div>

            <button type="submit" disabled={loading || submitted || !token} className="checkout-button">
              {loading ? 'Updating...' : submitted ? 'Done' : 'Update Password'}
            </button>

            <div className="auth-card-footer">
              <button type="button" className="inline-action" onClick={() => router.push('/login')}>
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}