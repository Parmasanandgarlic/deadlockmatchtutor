/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deadlock: {
          bg: '#050506',
          surface: '#0f1117',
          // Warmer art-deco panel (used by the alley scene + inner item frames)
          'surface-warm': '#1a1410',
          'surface-tile': '#0a1410',
          border: '#1a1d26',
          'border-warm': '#3a2e1f',
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
          // --- Deadlock in-game item rarity palette (from item highlight screen) ---
          bronze: '#d4a853',      // Common / Bronze item tier
          'bronze-glow': '#f5d78a',
          enhanced: '#4dd0e1',    // Enhanced / Uncommon (cyan-teal)
          'enhanced-glow': '#7ae8f5',
          rare: '#a855f7',        // Rare (purple)
          'rare-glow': '#c89dff',
          legendary: '#f5c242',   // Legendary / Mythic (saturated gold)
          'legendary-glow': '#ffe28a',
          ability: '#e879a5',     // Active ability / power spike accent
          'ability-glow': '#ff9cc2',
          // --- Art-deco environment accents (from Curiosity / Broadway scenes) ---
          sepia: '#b88f5a',       // Warm brick / stone
          'sepia-deep': '#5c4530',
          'tile-green': '#2f4a3a',// Broadway subway tile
          'tile-cream': '#e8d9b8',// Ceramic tile highlight
          'glass-warm': '#f5b455',// Stained-glass amber panel
          'glass-cool': '#6ec1b8',// Stained-glass teal panel
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
