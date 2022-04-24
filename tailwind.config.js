const colors = require('tailwindcss/colors')

delete colors.lightBlue

module.exports = {
  mode: 'jit',
  purge: [
    './src/**/*.html',
    './src/**/*.svelte',
    './src/**/*.ts',
    './src/**/*.json',
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {},
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...colors,
      gray: {
        100: '#f7fafc',
        200: '#edf2f7',
        300: '#e2e8f0',
        400: '#cbd5e0',
        500: '#a0aec0',
        600: '#718096',
        700: '#4a5568',
        800: '#2d3748',
        900: '#1a202c',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
