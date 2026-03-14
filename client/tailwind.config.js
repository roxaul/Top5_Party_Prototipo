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
  plugins: [
    // Utilitários para viewport height sem o bug do iOS Safari
    // e para safe-area (notch, barra home do iPhone)
    function({ addUtilities }) {
      addUtilities({
        // min-h-svh: altura mínima que nunca fica atrás da barra do browser
        '.min-h-svh': { minHeight: '100svh' },
        // min-h-dvh: altura dinâmica (muda quando barra aparece/desaparece)
        '.min-h-dvh': { minHeight: '100dvh' },

        // Padding para safe-area: respeita o notch e a barra home do iPhone
        '.pb-safe':   { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.pt-safe':   { paddingTop:    'env(safe-area-inset-top, 0px)' },
        '.pl-safe':   { paddingLeft:   'env(safe-area-inset-left, 0px)' },
        '.pr-safe':   { paddingRight:  'env(safe-area-inset-right, 0px)' },

        // Padding combinado: pb-safe + valor fixo (ex: pb-4-safe)
        '.pb-4-safe': { paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' },
        '.pb-6-safe': { paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' },
        '.pb-8-safe': { paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' },
      });
    },
  ],
};
