/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        party: {
          bg:      '#0f0f1a',
          surface: '#1a1a2e',
          border:  '#2d2d44',
          purple:  '#6c63ff',
          violet:  '#a78bfa',
        },
      },
    },
  },
  plugins: [],
};
