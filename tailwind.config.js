/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['"Merriweather"', 'serif'],
        display: ['"Montserrat"', 'sans-serif'],
      },
      colors: {
        primary: { 
          50: '#eff6ff', 
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', 
          600: '#2563eb', 
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        exam: {
          orange: '#d97706',
          blue: '#0284c7',
          green: '#059669',
          red: '#dc2626',
          indigo: '#4f46e5',
          purple: '#7c3aed',
          dark: '#090d16',
        }
      }
    },
  },
  plugins: [],
};
