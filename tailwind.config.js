/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        heading: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
      },
      colors: {
        botanical: {
          50: '#faf6f0',
          100: '#f0e6da',
          600: '#b85d19',
          800: '#7c3f11',
          900: '#4a250a',
        },
        terracotta: '#c85a32',
      },
    },
  },
  plugins: [],
};
