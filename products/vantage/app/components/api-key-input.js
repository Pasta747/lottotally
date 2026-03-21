'use client';

import { useState } from 'react';

export default function ApiKeyInput({ onKeySubmit }) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // V-KEYS: Simple API key validation for Kalshi
    if (!apiKey.startsWith('KALSHI_') || apiKey.length < 20) {
      setMessage('Please enter a valid Kalshi API key');
      setIsSubmitting(false);
      return;
    }

    try {
      // Save API key via API
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (res.ok) {
        setMessage('API key saved and encrypted successfully!');
        setApiKey('');
        if (onKeySubmit) {
          onKeySubmit();
        }
      } else {
        const error = await res.json();
        setMessage(error.error || 'Error saving API key. Please try again.');
      }
    } catch (error) {
      console.error('API key save error:', error);
      setMessage('Error saving API key. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Connect Your Kalshi Account</h3>
      <p style={{ marginTop: 8, color: '#666' }}>
        Enter your Kalshi API key to enable paper trading simulations.
      </p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div>
          <label htmlFor="apiKey" style={{ display: 'block', marginBottom: 8 }}>
            Kalshi API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="KALSHI_..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        
        {message && (
          <div style={{ 
            marginTop: 12, 
            padding: '8px 12px', 
            borderRadius: '4px',
            backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24'
          }}>
            {message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: 16,
            backgroundColor: '#000',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save API Key'}
        </button>
      </form>
      
      <div style={{ 
        marginTop: 16, 
        padding: 16, 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px' 
      }}>
        <p style={{ fontSize: '14px', margin: 0 }}>
          <strong>Security:</strong> Your API key is encrypted before storage using AES-256-GCM encryption. 
          It's only used for paper trading simulations and will never execute live trades.
        </p>
      </div>
    </div>
  );
}