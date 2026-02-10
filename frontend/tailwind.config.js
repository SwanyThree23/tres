/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'swany-dark': '#3C2F2F',
        'swany-panel': '#2A1F1F',
        'swany-gold': '#D4AF37',
        'swany-burgundy': '#800020',
        'swany-cream': '#F5E6D3',
      },
    },
  },
  plugins: [],
};
