/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FateDice 브랜드 색상
        brand: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // 타일 색상
        tile: {
          normal:   '#1e293b',
          warp_g:   '#15803d',
          warp_y:   '#a16207',
          warp_b:   '#1d4ed8',
          doa:      '#b91c1c',
          ability:  '#6d28d9',
          blessing: '#0e7490',
          curse:    '#9f1239',
          goal:     '#b45309',
        },
      },
      fontFamily: {
        game: ['var(--font-game)', 'sans-serif'],
      },
      animation: {
        'dice-roll': 'diceRoll 0.6s ease-in-out',
        'float':     'float 3s ease-in-out infinite',
        'glow':      'glow 2s ease-in-out infinite',
      },
      keyframes: {
        diceRoll: {
          '0%':   { transform: 'rotate(0deg) scale(1)' },
          '50%':  { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(217,70,239,0.5)' },
          '50%':      { boxShadow: '0 0 25px rgba(217,70,239,0.9)' },
        },
      },
    },
  },
  plugins: [],
}
