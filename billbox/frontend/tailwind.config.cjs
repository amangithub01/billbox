module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        background: '#F7F6F2',
        surface: '#FFFFFF',
        border: '#E7E5E0',
        text: '#1F2937',
        muted: '#6B7280',
        primary: '#0F766E',
        'primary-hover': '#115E59',
        'primary-tint': '#CCFBF1',
        warning: '#D97706',
        'warning-tint': '#FEF3C7',
        error: '#DC2626',
        'error-tint': '#FEE2E2',
        success: '#16A34A',
        'success-tint': '#DCFCE7',
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      spacing: {
        '2': '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        sm: ['12px', '1.5'],
        base: ['14px', '1.5'],
        lg: ['16px', '1.5'],
        xl: ['20px', '1.5'],
        '2xl': ['28px', '1.5'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
      },
    },
  },
  plugins: [],
};
