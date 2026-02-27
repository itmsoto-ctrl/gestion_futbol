/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'fut-gold': '#d4af37',
          'fut-dark': '#1a1a1a',
        },
        shine: {
          '0%': { transform: 'translateX(-200%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        shine: 'shine 3s infinite linear',
      },
    },
    plugins: [],
  }