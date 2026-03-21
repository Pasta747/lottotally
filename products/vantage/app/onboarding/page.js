'use client';

import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1>Welcome to Vantage</h1>
      <p>Next step: connect your Kalshi paper API keys and set bankroll/risk preferences.</p>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <Link href="/dashboard" style={{ background: '#000', color: '#fff', padding: '10px 14px', borderRadius: 6 }}>Go to Dashboard</Link>
        <Link href="/config" style={{ border: '1px solid #ccc', padding: '10px 14px', borderRadius: 6 }}>Open Settings</Link>
      </div>
    </main>
  );
}
