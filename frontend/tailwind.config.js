/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00ffcc',
          red: '#ff0033',
          orange: '#ff9900'
        }
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace']
      }
    },
  },
  plugins: [],
}
