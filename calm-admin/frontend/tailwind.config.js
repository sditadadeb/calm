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
          deep: '#C77E0A',
          dark: '#1a1a2e',
          light: '#f8f9fa',
        },
        // Nueva paleta oscura (rediseño): fondo profundo + superficies
        ink: {
          DEFAULT: '#0B0D11',
          raised: '#12151B',
          overlay: '#181C24',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          strong: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        'display': ['Space Grotesk', 'Be Vietnam Pro', 'sans-serif'],
        'body': ['Be Vietnam Pro', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
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
