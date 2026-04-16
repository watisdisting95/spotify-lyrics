/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1db954',
          black: '#191414',
          darkGrey: '#121212',
          lightGrey: '#282828',
          white: '#ffffff',
          grey: '#b3b3b3',
        }
      }
    },
  },
  plugins: [],
}
