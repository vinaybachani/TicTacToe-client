/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4B495F",
        // circlewon: "#DD7F9F",
        // crosswon: "#3FA7F0"
      }
    },
  },
  plugins: [],
}