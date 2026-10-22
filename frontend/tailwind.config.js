/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090d16',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          500: '#475569'
        },
        brand: {
          500: '#06b6d4',
          600: '#0891b2'
        }
      }
    },
  },
  plugins: [],
}
