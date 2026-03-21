'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    number: '01',
    title: 'Connect your Kalshi account',
    description: 'Add your Kalshi API keys so Vantage can scan markets and execute trades on your behalf.',
    action: { label: 'Open Settings', href: '/config' },
    icon: '🔑',
  },
  {
    number: '02',
    title: 'Set your bankroll & risk limits',
    description: 'Tell Vantage how much capital to deploy and your per-trade risk tolerance. It won\'t exceed your limits.',
    action: null,
    icon: '⚖️',
  },
  {
    number: '03',
    title: 'Review your dashboard',
    description: 'Track live EV+ opportunities, open positions, P&L, and performance analytics in one place.',
    action: { label: 'Go to Dashboard', href: '/dashboard' },
    icon: '📊',
  },
];

export default function OnboardingPage() {
  const [hovered, setHovered] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    // If user already has API keys configured, skip onboarding and go straight to dashboard
    fetch('/api/user/config')
      .then(r => r.json())
      .then(d => {
        // Check for existing keys
        return fetch('/api/kalshi/positions');
      })
      .then(r => r.json())
      .then(d => {
        // If not noKeys (i.e. keys exist), redirect to dashboard
        if (!d.noKeys) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {}); // on error, stay on onboarding
  }, [status, router]);

  if (status === 'loading') return null;

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: 600, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#000',
            color: '#fff',
            borderRadius: 12,
            padding: '8px 18px',
            marginBottom: 24,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.3px',
          }}>
            ⚡ Vantage
          </div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#111',
            margin: '0 0 12px',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            You're in. Let's get you set up.
          </h1>
          <p style={{ fontSize: 17, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Vantage scans prediction markets 24/7 and surfaces high-EV trades so you never miss an edge.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: '24px',
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                fontSize: 28,
                lineHeight: 1,
                minWidth: 40,
                textAlign: 'center',
              }}>{step.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>STEP {step.number}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>{step.description}</p>
                {step.action && (
                  <Link
                    href={step.action.href}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'inline-block',
                      background: hovered === i ? '#111' : '#000',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    {step.action.label} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: '#000',
          borderRadius: 16,
          padding: '28px 32px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: 15, color: '#9ca3af' }}>
            Ready to explore? You can always configure later.
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            background: '#fff',
            color: '#000',
            padding: '12px 28px',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '-0.2px',
          }}>
            Go to Dashboard →
          </Link>
        </div>

      </div>
    </main>
  );
}
