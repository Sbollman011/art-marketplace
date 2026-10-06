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

      // Store appropriate tokens
      if (data.adminToken) {
        localStorage.setItem('adminToken', data.adminToken);
        localStorage.setItem('adminEmail', data.adminEmail);
      }

      if (data.customerToken) {
        localStorage.setItem('customerToken', data.customerToken);
        localStorage.setItem('customerEmail', data.customerEmail);
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

      {/* Login Form */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        marginTop: '4rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{
            color: '#cbd5e1',
            fontSize: '1rem'
          }}>
            {isSignUp ? 'Join our art community' : 'Login to your account'}
          </p>
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
              fontWeight: '500',
              fontSize: '0.95rem'
            }}>
              ❌ {error}
            </div>
          )}

          {isSignUp && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#0f172a'
              }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={isSignUp}
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
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#0f172a'
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#cbd5e1' : '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#db2777')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#ec4899')}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem',
              margin: 0
            }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setName('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ec4899',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 'inherit'
                }}
              >
                {isSignUp ? 'Login here' : 'Sign up here'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
