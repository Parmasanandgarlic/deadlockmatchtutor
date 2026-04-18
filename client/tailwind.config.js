/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deadlock: {
          bg: '#050506',
          surface: '#0f1117',
          border: '#1a1d26',
          blue: '#3b7db2',
          amber: '#ffad1c',
          accent: '#ffad1c', // Default accent to amber
          'accent-dim': '#c2780e',
          red: '#ff4d4d',
          green: '#2ecc71',
          purple: '#a855f7',
          muted: '#666b7a',
          text: '#ffffff',
          'text-dim': '#a1a1aa',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        serif: ['Cinzel Decorative', 'serif'],
        sketch: ['Permanent Marker', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      screens: {
        'xs': '475px',
        'sm-safe': '640px',
      },
    },
  },
  plugins: [],
};
