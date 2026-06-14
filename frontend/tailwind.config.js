/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nossa paleta Dourada principal
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        // Fundo escuro para o tema Dark
        dark: {
          bg: '#121212',
          card: '#1E1E1E',
          border: '#2D2D2D'
        }
      }
    },
  },
  plugins: [],
}