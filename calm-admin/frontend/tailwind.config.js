/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        calm: {
          primary: '#F5A623',
          secondary: '#FFBB54',
          dark: '#1a1a2e',
          light: '#f8f9fa',
        }
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Source Sans Pro', 'sans-serif'],
        'vietnam': ['Be Vietnam Pro', 'Arial', 'sans-serif'],
        'sans': ['Be Vietnam Pro', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
