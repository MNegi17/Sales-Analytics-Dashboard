/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36aff8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0a374d',
        },
        excel: {
          header: '#e2efda',      // Light green Excel header
          blueHeader: '#d9e1f2',  // Light blue Excel header
          yellowTotal: '#fff2cc', // Soft yellow total row
          zebra: '#f9fafb',      // Zebra row striping
          border: '#d1d5db',     // Crisp grid border
        }
      }
    },
  },
  plugins: [],
}
