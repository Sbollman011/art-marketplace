'use client';

import { useState } from 'react';

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <a href="/" style={{ textDecoration: 'none', display: 'block' }}>
            <h1 style={{
              margin: 0,
              color: '#ec4899',
              fontSize: '1.5rem',
              fontWeight: '900',
              letterSpacing: '-1px',
              fontStyle: 'italic',
              textTransform: 'uppercase'
            }}>
              Gabriel
            </h1>
            <p style={{
              margin: '0.1rem 0 0 0',
              color: '#f59e0b',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Contemporary Art
            </p>
          </a>
        </div>
        <a href="/" style={{
          padding: '0.6rem 1.2rem',
          background: 'rgba(226, 232, 240, 0.1)',
          color: '#cbd5e1',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '600',
          fontSize: '0.9rem',
          transition: 'all 0.2s',
          border: '1px solid rgba(226, 232, 240, 0.2)'
        }}
        onMouseEnter={(e) => { e.target.style.background = 'rgba(226, 232, 240, 0.15)'; e.target.style.borderColor = 'rgba(236, 72, 153, 0.5)'; e.target.style.color = '#ec4899'; }}
        onMouseLeave={(e) => { e.target.style.background = 'rgba(226, 232, 240, 0.1)'; e.target.style.borderColor = 'rgba(226, 232, 240, 0.2)'; e.target.style.color = '#cbd5e1'; }}
        >← Gallery</a>
      </div>

      {/* Contact Form */}
      <div style={{
        width: '100%',
        maxWidth: '550px',
        marginTop: '6rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            color: 'white',
            marginBottom: '0.5rem',
            letterSpacing: '-1px'
          }}>Get in Touch</h2>
          <p style={{
            color: '#cbd5e1',
            fontSize: '1.05rem'
          }}>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontWeight: '500'
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontWeight: '500'
            }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#0f172a'
            }}>Your Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ec4899'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#0f172a'
            }}>Your Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ec4899'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#0f172a'
            }}>Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us what's on your mind..."
              required
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ec4899'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: loading ? '#cbd5e1' : '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#db2777')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#ec4899')}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#cbd5e1',
          marginTop: '2rem',
          fontSize: '0.9rem'
        }}>
          We typically respond within 24 hours
        </p>
      </div>
    </div>
  );
}
