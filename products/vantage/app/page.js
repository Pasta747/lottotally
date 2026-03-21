'use client';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Poppins', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        @media (max-width: 768px) {
          .hero-title { font-size: 40px !important; letter-spacing: -1px !important; }
          .hero-sub { font-size: 17px !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns a { text-align: center; }
          .stats-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .markets-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .atlas-box { padding: 40px 28px !important; }
          .nav-links { display: none !important; }
          .footer-inner { flex-direction: column !important; align-items: flex-start !important; }
          .nav-inner { padding: 0 20px !important; }
          .section-pad { padding: 64px 20px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid #f0f0f0',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div className="nav-inner" style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', height: '64px',
        }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Vantage</span>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#how" style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>How it works</a>
            <a href="#markets" style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Markets</a>
            <a href="/login" style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Sign in</a>
            <a href="/signup" style={{
              background: '#0f172a', color: '#fff',
              padding: '8px 20px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600,
            }}>Join Beta</a>
          </div>
          <a href="/signup" className="nav-mobile-cta" style={{
            background: '#0f172a', color: '#fff',
            padding: '8px 16px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600,
            display: 'none',
          }}>Join Beta</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="section-pad" style={{ paddingTop: '140px', paddingBottom: '96px', paddingLeft: '24px', paddingRight: '24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            border: '1px solid #e2e8f0', background: '#f8fafc',
            borderRadius: '100px', padding: '6px 16px',
            fontSize: '12px', fontWeight: 600, color: '#475569',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            marginBottom: '32px',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            Private beta · Paper trading only
          </div>

          <h1 className="hero-title" style={{
            fontSize: '64px', fontWeight: 800, letterSpacing: '-2px',
            lineHeight: 1.1, color: '#0f172a', marginBottom: '24px',
          }}>
            Your AI prediction<br />market agent.
          </h1>

          <p className="hero-sub" style={{
            fontSize: '20px', color: '#64748b',
            lineHeight: 1.7, maxWidth: '540px', margin: '0 auto 40px',
          }}>
            Vantage scans every Kalshi market, surfaces same-day opportunities, and gets smarter with every outcome.
          </p>

          <div className="hero-btns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a href="/signup" style={{
              background: '#0f172a', color: '#fff',
              padding: '16px 36px', borderRadius: '12px',
              fontSize: '16px', fontWeight: 700,
              boxShadow: '0 4px 24px rgba(15,23,42,0.18)',
            }}>
              Join Beta — Free
            </a>
            <a href="#how" style={{
              border: '1.5px solid #e2e8f0', color: '#374151',
              padding: '16px 36px', borderRadius: '12px',
              fontSize: '16px', fontWeight: 600, background: '#fff',
            }}>
              See how it works
            </a>
          </div>
          <p style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>
            Paper trading only · No real money at risk
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', padding: '40px 24px' }}>
        <div className="stats-grid" style={{
          maxWidth: '860px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', textAlign: 'center',
        }}>
          {[
            { val: '6', label: 'Market categories' },
            { val: '10 min', label: 'Scan frequency' },
            { val: 'Same-day', label: 'Settlement only' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>{s.val}</div>
              <div style={{ marginTop: '4px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section-pad" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', letterSpacing: '-1px' }}>
              How Vantage works
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b' }}>
              Signal. Score. Decide.
            </p>
          </div>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { step: '01', title: 'Find the signal', desc: 'Vantage continuously scans Kalshi markets across every category — sports, politics, economics, weather, crypto, and more.' },
              { step: '02', title: 'Score the edge', desc: 'Vantage evaluates and ranks each opportunity. Not every signal is equal — and the system knows the difference.' },
              { step: '03', title: 'You decide', desc: 'Receive clean, sized signals. In beta, every trade is approval-first. You see the opportunity and choose to act.' },
            ].map((c) => (
              <div key={c.title} style={{
                border: '1.5px solid #e2e8f0', borderRadius: '16px',
                background: '#fff', padding: '36px 32px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '20px' }}>STEP {c.step}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{c.title}</h3>
                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.65 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="section-pad" style={{ padding: '96px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', letterSpacing: '-1px' }}>
              Every Kalshi market, every day
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b' }}>
              Edge exists wherever prices are stale. We cover all of it.
            </p>
          </div>
          <div className="markets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Sports', desc: 'NBA, MLB, MLS and more' },
              { label: 'Politics', desc: 'Senate votes, executive actions' },
              { label: 'Economics', desc: 'Fed rate, CPI, jobs reports' },
              { label: 'Weather', desc: 'Temperature and storm markets' },
              { label: 'Crypto', desc: 'BTC, ETH daily price markets' },
              { label: 'Entertainment', desc: 'Awards, box office, live events' },
            ].map((m) => (
              <div key={m.label} style={{
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                background: '#fff', padding: '24px',
              }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ATLAS section */}
      <section className="section-pad" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div className="atlas-box" style={{
            border: '1.5px solid #e2e8f0', borderRadius: '20px',
            background: '#0f172a', padding: '64px 56px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', marginBottom: '20px', textTransform: 'uppercase' }}>
              Built different
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', marginBottom: '20px', letterSpacing: '-0.5px' }}>
              Gets sharper with every outcome
            </h2>
            <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: 1.75, marginBottom: '16px' }}>
              Most tools treat every signal equally. Vantage doesn't. The longer it runs, the better it gets at separating real edge from noise.
            </p>
            <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: 1.75 }}>
              We built it to improve on its own — so you don't have to tune it.
            </p>
          </div>
        </div>
      </section>

      {/* Beta CTA */}
      <section className="section-pad" style={{ padding: '96px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', letterSpacing: '-1px' }}>
            Ready to see the edge?
          </h2>
          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.7, marginBottom: '40px' }}>
            Join the private beta. Connect your Kalshi account. All paper trading — no real money at risk.
          </p>
          <a href="/signup" style={{
            display: 'inline-block',
            background: '#0f172a', color: '#fff',
            padding: '18px 48px', borderRadius: '12px',
            fontSize: '18px', fontWeight: 700,
            boxShadow: '0 4px 24px rgba(15,23,42,0.18)',
          }}>
            Join Beta — Free
          </a>
          <div style={{
            marginTop: '32px', borderRadius: '12px',
            border: '1.5px solid #fcd34d', background: '#fffbeb',
            padding: '16px 24px', fontSize: '14px', color: '#92400e', lineHeight: 1.6,
          }}>
            Paper trading only. Not financial advice. For research and testing purposes only.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f1f5f9', padding: '32px 24px' }}>
        <div className="footer-inner" style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>Vantage</span>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>© 2026 Vantage · yourvantage.ai</p>
          <a href="mailto:hello@yourvantage.ai" style={{ fontSize: '14px', color: '#64748b' }}>hello@yourvantage.ai</a>
        </div>
      </footer>

    </div>
  );
}
