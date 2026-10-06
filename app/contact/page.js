'use client';

import { useState } from 'react';
import PublicHeader from '../components/public-header';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess('✅ Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
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
          <h2>Reach the studio directly.</h2>
          <p>Questions about a piece, commissions, shipping, or availability all belong here. Send the note and the studio will follow up directly.</p>
          <p className="auth-meta">Typical response time: within 24 hours.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3>Get in Touch</h3>
            <p>Use the form for inquiries, follow-ups, or collector questions.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <div className="auth-field">
              <label htmlFor="contact-name">Your Name</label>
              <input
                id="contact-name"
                className="auth-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="contact-email">Your Email</label>
              <input
                id="contact-email"
                className="auth-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                className="auth-textarea"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                required
              />
            </div>

            <button type="submit" disabled={loading} className="checkout-button">
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
