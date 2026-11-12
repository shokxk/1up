/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Inter', 'sans-serif'],
      },
      colors: {
        apple: {
          green: '#22C55E',
          greenLight: '#DCFCE7',
          blue: '#0057FF',
          blueDark: '#122E72',
          bg: '#F2F4F8',
          card: '#FFFFFF',
          darkBg: '#090D16',
          darkCard: '#131B2E'
        }
      }
    },
  },
  plugins: [],
}
