import React, { useEffect } from 'react';

export default function SettingsModal({ show, setShow, settings, setSettings }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show) {
        setShow(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, setShow]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={() => setShow(false)}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#0F766E',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ⚙️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                System & AI Extraction Settings
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                Configure GST verification rules & thresholds
              </p>
            </div>
          </div>
          <button
            onClick={() => setShow(false)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Home State */}
          <div>
            <label
              htmlFor="homeState"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
            >
              Buyer Home State (GST Jurisdiction)
            </label>
            <select
              id="homeState"
              name="homeState"
              value={settings.homeState || '27 - Maharashtra'}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
              }}
            >
              <option value="27 - Maharashtra">27 - Maharashtra (Default)</option>
              <option value="29 - Karnataka">29 - Karnataka</option>
              <option value="07 - Delhi">07 - Delhi</option>
              <option value="33 - Tamil Nadu">33 - Tamil Nadu</option>
              <option value="24 - Gujarat">24 - Gujarat</option>
            </select>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B' }}>
              Used to determine intra-state (CGST+SGST) vs inter-state (IGST) tax compliance.
            </p>
          </div>

          {/* AI Confidence Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                htmlFor="confidenceThreshold"
                style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}
              >
                AI Confidence Flag Threshold
              </label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F766E' }}>
                {settings.confidenceThreshold || 85}%
              </span>
            </div>
            <input
              id="confidenceThreshold"
              name="confidenceThreshold"
              type="range"
              min="60"
              max="99"
              value={settings.confidenceThreshold || 85}
              onChange={handleChange}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#0F766E' }}
            />
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B' }}>
              Extractions scored below this score are automatically flagged as "Needs Review".
            </p>
          </div>

          {/* Reviewer Email */}
          <div>
            <label
              htmlFor="reviewerEmail"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
            >
              Auditor / Reviewer Notification Email
            </label>
            <input
              id="reviewerEmail"
              name="reviewerEmail"
              type="email"
              placeholder="e.g. finance@yourcompany.com"
              value={settings.reviewerEmail || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                color: '#0F172A',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Checkbox: Double Check GST math */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
            <input
              id="doubleCheck"
              name="doubleCheck"
              type="checkbox"
              checked={settings.doubleCheck !== false}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#0F766E' }}
            />
            <label htmlFor="doubleCheck" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <strong>Double-check GST Math:</strong> Automatically verify that Rate × Qty = Amount and Subtotal + Taxes = Total Amount.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={() => setShow(false)}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            Cancel
          </button>
          <button
            onClick={() => setShow(false)}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0F766E',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#115E59')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F766E')}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
