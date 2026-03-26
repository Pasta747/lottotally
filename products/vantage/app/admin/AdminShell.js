'use client';

import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminShell({ session, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/signals', label: 'Signal Log' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Admin Header */}
      <header style={{ background: '#111827', color: 'white', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #374151', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
            ⚡ VANTAGE ADMIN
          </span>
          <nav style={{ display: 'flex', gap: 4 }}>
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                style={{
                  color: pathname === link.href ? 'white' : '#9ca3af',
                  background: pathname === link.href ? '#374151' : 'transparent',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: pathname === link.href ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>{session?.user?.name || session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ background: '#374151', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
