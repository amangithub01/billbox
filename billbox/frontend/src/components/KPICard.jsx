import React from 'react';

export default function KPICard({ title, value, iconColor = '#64748B', borderColor = '#E2E8F0', icon }) {
  // Determine appropriate icon & accent based on title
  const getIcon = () => {
    if (icon) return icon;
    if (title.toLowerCase().includes('total invoice')) return '📄';
    if (title.toLowerCase().includes('review')) return '⚠️';
    if (title.toLowerCase().includes('approved')) return '✅';
    if (title.toLowerCase().includes('value') || title.toLowerCase().includes('inr')) return '💰';
    return '📊';
  };

  const getAccentBg = () => {
    if (title.toLowerCase().includes('review')) return '#FEF3C7';
    if (title.toLowerCase().includes('approved')) return '#DCFCE7';
    if (title.toLowerCase().includes('value')) return '#E0F2FE';
    return '#F1F5F9';
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px 22px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.02)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: getAccentBg(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          {getIcon()}
        </div>
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: iconColor !== '#64748B' ? iconColor : '#0F172A',
          letterSpacing: '-0.5px',
          fontFamily: title.toLowerCase().includes('value') ? '"JetBrains Mono", monospace' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}
