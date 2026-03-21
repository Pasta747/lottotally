'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Disclaimer from '../components/disclaimer';

export default function ConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState({
    bankroll: 1000,
    risk_level: 'moderate',
    whatsapp: '',
    auto_execute: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signup');
    }
  }, [status, router]);

  // Load config on mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadConfig();
    }
  }, [status]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/user/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankrollChange = (e) => {
    setConfig({
      ...config,
      bankroll: e.target.value
    });
  };

  const handleRiskLevelChange = (e) => {
    setConfig({
      ...config,
      risk_level: e.target.value
    });
  };

  const handleWhatsappChange = (e) => {
    setConfig({
      ...config,
      whatsapp: e.target.value
    });
  };

  const handleAutoExecuteChange = (e) => {
    setConfig({
      ...config,
      auto_execute: e.target.checked
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/user/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (res.ok) {
        setMessage('Configuration saved successfully!');
      } else {
        const error = await res.json();
        setMessage(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Vantage Configuration</h1>
        <a 
          href="/dashboard" 
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Back to Dashboard
        </a>
      </div>
      
      <div style={{ marginTop: 24 }}>
        <h2>Account Settings</h2>
        <p>Configure your trading preferences and notification settings.</p>
      </div>
      
      {loading ? (
        <div>Loading configuration...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          {/* Bankroll Section */}
          <div style={{ 
            padding: 24, 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Bankroll Management</h3>
            <div style={{ marginTop: 16 }}>
              <label htmlFor="bankroll" style={{ display: 'block', marginBottom: 8 }}>
                Paper Trading Bankroll ($)
              </label>
              <input
                id="bankroll"
                type="number"
                value={config.bankroll}
                onChange={handleBankrollChange}
                placeholder="Enter your paper trading bankroll"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              <p style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>
                This helps Vantage recommend position sizes appropriate for your capital.
              </p>
            </div>
          </div>
          
          {/* Risk Level Section */}
          <div style={{ 
            marginTop: 24,
            padding: 24, 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Risk Level</h3>
            <div style={{ marginTop: 16 }}>
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend style={{ position: 'absolute', clip: 'rect(0 0 0 0)' }}>
                  Select your risk tolerance
                </legend>
                
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { value: 'conservative', label: 'Conservative', desc: 'Lower risk, smaller positions' },
                    { value: 'moderate', label: 'Moderate', desc: 'Balanced risk and reward' },
                    { value: 'aggressive', label: 'Aggressive', desc: 'Higher risk, larger positions' }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: config.risk_level === option.value ? '#e3f2fd' : '#fff'
                      }}
                    >
                      <input
                        type="radio"
                        name="risk_level"
                        value={option.value}
                        checked={config.risk_level === option.value}
                        onChange={handleRiskLevelChange}
                        style={{ marginTop: 4, marginRight: 8 }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
          
          {/* Notifications Section */}
          <div style={{ 
            marginTop: 24,
            padding: 24, 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Notifications</h3>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={config.auto_execute}
                  onChange={handleAutoExecuteChange}
                  style={{ marginRight: 8 }}
                />
                <span>Auto-execute approved trades</span>
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                WhatsApp Number
                <input
                  type="text"
                  value={config.whatsapp}
                  onChange={handleWhatsappChange}
                  placeholder="+1..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                    marginTop: 4
                  }}
                />
              </label>
            </div>
          </div>
          
          {message && (
            <div style={{ 
              marginTop: 16, 
              padding: '12px', 
              borderRadius: '4px',
              backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
              color: message.includes('success') ? '#155724' : '#721c24'
            }}>
              {message}
            </div>
          )}
          
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                backgroundColor: '#000',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                padding: '12px 24px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      <Disclaimer />
      
      <div style={{ marginTop: 24 }}>
        <p><strong>Note:</strong> Paper trading only. Not financial advice. For testing and research purposes.</p>
      </div>
    </main>
  );
}