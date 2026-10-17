import React from 'react';

export default function Navbar({ isBackendOnline, checkBackend, exportCSV, exportJSON, toggleSettings }) {
  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)',
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.5px',
              }}
            >
              BillBox
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#F0FDFA',
                color: '#0F766E',
                border: '1px solid #CCFBF1',
                letterSpacing: '0.3px',
              }}
            >
              AI Invoice Hub
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Backend Status Pill */}
          <button
            onClick={checkBackend}
            title="Click to re-check backend connection status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${isBackendOnline ? '#BBF7D0' : '#FDE68A'}`,
              background: isBackendOnline ? '#DCFCE7' : '#FEF3C7',
              color: isBackendOnline ? '#166534' : '#92400E',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isBackendOnline ? '#16A34A' : '#D97706',
                display: 'inline-block',
              }}
            />
            {isBackendOnline ? 'Backend Online (Port 8000)' : 'Demo Mode (Offline Ready)'}
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <span>📥</span> CSV
          </button>

          {/* Export JSON */}
          <button
            onClick={exportJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <span>📄</span> JSON
          </button>

          {/* Settings Button */}
          <button
            onClick={toggleSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid #0F766E',
              background: '#0F766E',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#115E59')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F766E')}
          >
            <span>⚙️</span> Settings
          </button>
        </div>
      </div>
    </header>
  );
}
