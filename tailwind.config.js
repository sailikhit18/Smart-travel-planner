/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        sand: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#e9dfcc',
          300: '#d8c9ab',
        },
        ink: {
          DEFAULT: '#1d2b2a',
          soft: '#4a5a58',
          mute: '#7b8886',
        },
        lagoon: {
          50: '#e8f4f2',
          100: '#cfe8e4',
          500: '#1f8a7e',
          600: '#167065',
          700: '#10564e',
          900: '#0a2f2b',
        },
        coral: {
          50: '#fff1ec',
          100: '#ffdcd0',
          500: '#f0623a',
          600: '#d94d27',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,43,42,.06), 0 8px 24px -12px rgba(29,43,42,.18)',
      },
    },
  },
  plugins: [],
};
