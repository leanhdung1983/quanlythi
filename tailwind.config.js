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
          500: '#3b82f6', 
          600: '#2563eb', 
          700: '#1d4ed8' 
        },
        exam: {
          orange: '#ea580c',
          blue: '#0284c7',
          green: '#10b981',
          red: '#ef4444',
          indigo: '#4f46e5',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
};
