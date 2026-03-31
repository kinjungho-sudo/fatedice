import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design Bible 컬러 팔레트
        'bg-base':      '#0F0B2E',
        'bg-card':      '#1A1542',
        'brand-purple': '#7C3AED',
        'brand-gold':   '#F59E0B',
        'electric-blue':'#3B82F6',
        // 등급 컬러
        'grade-normal':    '#9CA3AF',
        'grade-rare':      '#60A5FA',
        'grade-epic':      '#A855F7',
        'grade-legendary': '#F59E0B',
        // 클래스 컬러
        'class-king':   '#EF4444',
        'class-queen':  '#EC4899',
        'class-rook':   '#6B7280',
        'class-bishop': '#8B5CF6',
        'class-knight': '#10B981',
        'class-pawn':   '#F97316',
      },
      fontFamily: {
        sans:   ['Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
        heading:['Gmarket Sans', 'Pretendard', 'sans-serif'],
        mono:   ['Rajdhani', 'monospace'],
      },
      backgroundImage: {
        'hero':      'linear-gradient(135deg, #0F0B2E 0%, #1A0A3E 50%, #0D1B4E 100%)',
        'cta':       'linear-gradient(90deg, #7C3AED 0%, #5B21B6 100%)',
        'legendary': 'linear-gradient(135deg, #78350F 0%, #F59E0B 50%, #78350F 100%)',
        'epic':      'linear-gradient(135deg, #4C1D95 0%, #A855F7 50%, #4C1D95 100%)',
        'rare':      'linear-gradient(135deg, #1E3A8A 0%, #60A5FA 50%, #1E3A8A 100%)',
        'ag-bar':    'linear-gradient(90deg, #7C3AED 0%, #F59E0B 100%)',
      },
      animation: {
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'genesis-flash': 'genesisFlash 0.3s ease-out',
        'dice-spin':     'diceSpin 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'card-flip':     'cardFlip 0.5s ease-in-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'ag-ready':      'agReady 0.6s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.4)' },
          '50%':      { boxShadow: '0 0 40px rgba(124,58,237,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        genesisFlash: {
          '0%':   { opacity: '0.8', backgroundColor: 'rgba(255,0,0,0.7)' },
          '100%': { opacity: '0' },
        },
        diceSpin: {
          '0%':   { transform: 'rotateX(0deg) rotateY(0deg) scale(0)' },
          '50%':  { transform: 'rotateX(360deg) rotateY(180deg) scale(1.2)' },
          '100%': { transform: 'rotateX(720deg) rotateY(360deg) scale(1)' },
        },
        cardFlip: {
          '0%':   { transform: 'rotateY(180deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)',   opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        agReady: {
          '0%':   { transform: 'scale(1)',    boxShadow: '0 0 0 rgba(245,158,11,0)' },
          '50%':  { transform: 'scale(1.05)', boxShadow: '0 0 30px rgba(245,158,11,0.8)' },
          '100%': { transform: 'scale(1)',    boxShadow: '0 0 10px rgba(245,158,11,0.4)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
