'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Disclaimer from '../components/disclaimer';

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.yourvantage.ai';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCredentials = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: `${APP_BASE}/dashboard`,
    });

    if (res?.error) {
      setError(res.error || 'Failed to sign in');
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1>Vantage Beta Signup</h1>

      <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
        <button onClick={() => signIn('google', { callbackUrl: `${APP_BASE}/onboarding` })} style={btnLight}>
          Continue with Google
        </button>
        <button onClick={() => signIn('apple', { callbackUrl: `${APP_BASE}/onboarding` })} style={btnLight}>
          Continue with Apple
        </button>
      </div>

      <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: '#ddd' }} />
        <span style={{ fontSize: 12, color: '#666' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#ddd' }} />
      </div>

      <form onSubmit={handleCredentials}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 8 }}>Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={input} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 8 }}>Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={input} />
        </div>

        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

        <button type="submit" disabled={isSubmitting} style={btnDark}>
          {isSubmitting ? 'Signing in...' : 'Continue with Email'}
        </button>
      </form>

      <Disclaimer />
      <div style={{ marginTop: 24 }}>
        <p><strong>Paper trading only. Not financial advice. For testing and research purposes.</strong></p>
      </div>
    </main>
  );
}

const input = { width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 6, fontSize: 16 };
const btnDark = { background: '#000', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 18px', cursor: 'pointer' };
const btnLight = { background: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: 6, padding: '12px 18px', cursor: 'pointer' };
