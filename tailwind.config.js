/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          bg: '#FAF8F0',
          card: '#FFFFFF',
          yellow: '#FFE600',
          cyan: '#00E5FF',
          pink: '#FF5CAA',
          green: '#10E761',
          lime: '#A3E635',
          purple: '#A855F7',
          orange: '#FF6B00',
          blue: '#2563EB',
          red: '#EF4444',
          black: '#000000',
        },
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-xl': '8px 8px 0px 0px #000000',
        'brutal-cyan': '4px 4px 0px 0px #00E5FF',
        'brutal-pink': '4px 4px 0px 0px #FF5CAA',
        'brutal-yellow': '4px 4px 0px 0px #FFE600',
        'brutal-green': '4px 4px 0px 0px #10E761',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
