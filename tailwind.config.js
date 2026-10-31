/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nothing: {
          bg: '#080809',
          card: '#121214',
          subcard: '#18181b',
          border: '#242428',
          hover: '#1e1e22',
          muted: '#8e8e93',
          red: '#ea3829',
          'red-glow': 'rgba(234, 56, 41, 0.25)',
          green: '#22c55e',
          'green-glow': 'rgba(34, 197, 94, 0.25)',
          amber: '#f59e0b',
        },
        light: {
          bg: '#f4f5f7',
          card: '#ffffff',
          subcard: '#f9fafb',
          border: '#e4e4e7',
          hover: '#f1f2f5',
          text: '#09090b',
          muted: '#71717a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glow-red': '0 0 20px -3px rgba(234, 56, 41, 0.4)',
        'glow-green': '0 0 20px -3px rgba(34, 197, 94, 0.4)',
      },
      transitionTimingFunction: {
        'emil-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'emil-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
    },
  },
  plugins: [],
};
