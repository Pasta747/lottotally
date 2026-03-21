'use client';

import { useState } from 'react';

export default function KalshiGuide() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    {
      id: 1,
      title: "Create a Kalshi Paper Account",
      description: "Visit kalshi.com and sign up for a paper trading account.",
      instruction: "Go to https://kalshi.com and click 'Sign Up'. Select 'Paper Trading' when prompted."
    },
    {
      id: 2,
      title: "Navigate to API Settings",
      description: "Access your account's API configuration.",
      instruction: "Log in to your Kalshi account, click your profile icon in the top right, then select 'Settings' → 'API Keys'."
    },
    {
      id: 3,
      title: "Generate New API Key",
      description: "Create a new key pair for Vantage integration.",
      instruction: "Click 'Generate New Key Pair', enter a descriptive name like 'Vantage Bot', and click 'Create'."
    },
    {
      id: 4,
      title: "Copy Your API Key",
      description: "Save your key for use with Vantage.",
      instruction: "Click the 'Copy' button next to your new API Key (the one that starts with KALSHI_). Store it securely."
    },
    {
      id: 5,
      title: "Paste in Vantage Dashboard",
      description: "Connect your account to Vantage.",
      instruction: "Return to this dashboard and paste your API key in the input field above, then click 'Save API Key'."
    }
  ];

  return (
    <div style={{ 
      marginTop: 32, 
      border: '1px solid #dee2e6', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '16px 24px',
        borderBottom: '1px solid #dee2e6',
        backgroundColor: '#e9ecef'
      }}>
        <h3 style={{ margin: 0 }}>Setting Up Your Kalshi Account</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
          Follow these steps to connect your Kalshi account for paper trading
        </p>
      </div>
      
      <div style={{ padding: 24 }}>
        {/* Progress indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 24,
          position: 'relative'
        }}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              style={{ 
                textAlign: 'center', 
                zIndex: 2, 
                backgroundColor: '#f8f9fa',
                padding: '0 4px'
              }}
            >
              <div 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: currentStep >= step.id ? '#007bff' : '#ced4da',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  margin: '0 auto'
                }}
              >
                {step.id}
              </div>
              <div 
                style={{ 
                  marginTop: 8, 
                  fontSize: '12px',
                  fontWeight: currentStep === step.id ? 'bold' : 'normal',
                  color: currentStep === step.id ? '#007bff' : '#666'
                }}
              >
                {step.title.split(' ')[0]}
              </div>
            </div>
          ))}
          <div 
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              height: 2,
              backgroundColor: '#ced4da',
              zIndex: 1
            }}
          ></div>
        </div>
        
        {/* Step content */}
        <div style={{ minHeight: 200 }}>
          {steps.map((step) => (
            currentStep === step.id && (
              <div key={step.id}>
                <h4 style={{ margin: '0 0 8px 0' }}>{step.title}</h4>
                <p style={{ color: '#666', margin: '0 0 16px 0' }}>{step.description}</p>
                
                <div style={{
                  padding: 16,
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>{step.instruction}</p>
                </div>
                
                {/* Placeholder for screenshots */}
                <div style={{
                  marginTop: 16,
                  height: 150,
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #adb5bd'
                }}>
                  <span style={{ color: '#6c757d', fontSize: '14px' }}>
                    [Screenshot: {step.title}]
                  </span>
                </div>
              </div>
            )
          ))}
        </div>
        
        {/* Navigation buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 24 
        }}>
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            style={{
              padding: '8px 16px',
              backgroundColor: currentStep === 1 ? '#e9ecef' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
            disabled={currentStep === steps.length}
            style={{
              padding: '8px 16px',
              backgroundColor: currentStep === steps.length ? '#e9ecef' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentStep === steps.length ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>
      
      <div style={{ 
        padding: '16px 24px',
        borderTop: '1px solid #dee2e6',
        backgroundColor: '#fff3cd'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          <strong>Security Reminder:</strong> Never share your API secret. Vantage only requires the API key for paper trading simulations.
        </p>
      </div>
    </div>
  );
}