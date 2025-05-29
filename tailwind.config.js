/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1', // Indigo
          dark: '#4F46E5',
          light: '#818CF8',
        },
        secondary: {
          DEFAULT: '#F472B6', // Pink
          dark: '#DB2777',
          light: '#F9A8D4',
        },
        background: {
          DEFAULT: '#F8FAFC', // Slate 50
          dark: '#0F172A', // Slate 900
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Note: Custom fonts need special setup in RN
      },
    },
  },
  plugins: [],
  // Remove these - not needed for React Native
  // important: 'html',
  // corePlugins: {
  //   preflight: false,
  // },
}