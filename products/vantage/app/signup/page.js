'use client';

import { signIn } from 'next-auth/react';

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://yourvantage.ai';

export default function SignupPage() {
  return (
    <main style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        padding: '40px 36px', width: '100%', maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Vantage</span>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>Join the private beta</p>
        </div>

        {/* Google button */}
        <button
          onClick={() => signIn('google', { callbackUrl: `${APP_BASE}/onboarding` })}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            background: '#fff', color: '#374151',
            border: '1.5px solid #e2e8f0', borderRadius: '10px',
            padding: '14px 18px', cursor: 'pointer',
            fontSize: '15px', fontWeight: 600,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            fontFamily: 'inherit',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </g>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
          Beta is invite-only · No credit card required
        </p>

        {/* Disclaimer */}
        <div style={{
          marginTop: '24px', padding: '12px 16px',
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: '8px', fontSize: '12px', color: '#92400e', lineHeight: 1.6,
        }}>
          Paper trading only. Not financial advice. For research and testing purposes only.
        </div>
      </div>
    </main>
  );
}
