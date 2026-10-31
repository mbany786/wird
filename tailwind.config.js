/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Plus Jakarta Sans"',
          '"Geeza Pro"',
          '"Damascus"',
          '"Al Nile"',
          '"Noto Naskh Arabic"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
        arabic: [
          '"Geeza Pro"',
          '"Damascus"',
          '"Al Nile"',
          '"Noto Naskh Arabic"',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ]
      },
      colors: {
        // Neutral surfaces/text driven by CSS variables so dark/light themes (and any future
        // retuning) only touch index.css, never the ~600 className strings that use these.
        slate: {
          50: 'rgb(var(--slate-50) / <alpha-value>)',
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
          800: 'rgb(var(--slate-800) / <alpha-value>)',
          900: 'rgb(var(--slate-900) / <alpha-value>)',
          950: 'rgb(var(--slate-950) / <alpha-value>)',
        },
        // Accent families desaturated ~20% from stock Tailwind so they read as calm signal
        // rather than saturated neon against the new dark-grey surfaces.
        emerald: { 50:'#eefbf5',100:'#d5f6e5',200:'#afebcf',300:'#7adbb4',400:'#44c395',500:'#21a87b',600:'#148864',700:'#106c52',800:'#0f5642',900:'#0d4738',950:'#062820' },
        rose:    { 50:'#fef2f3',100:'#fce7e8',200:'#f9d2d7',300:'#f4adb6',400:'#ed7f8f',500:'#e2516a',600:'#cd3153',700:'#ad2345',800:'#91203f',900:'#7c1f3b',950:'#450c1c' },
        amber:   { 50:'#fdfaed',100:'#f8f0cc',200:'#f2df95',300:'#ebca5e',400:'#e6b639',500:'#de9822',600:'#c4761b',700:'#a3551a',800:'#85431b',900:'#6e3819',950:'#3e1c0a' },
        sky:     { 50:'#f2f9fd',100:'#e3f1fb',200:'#c1e4f6',300:'#8aceef',400:'#4bb6e5',500:'#249dd3',600:'#167eb3',700:'#136491',800:'#145578',900:'#164764',950:'#0e2e42' },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        }
      }
    },
  },
  plugins: [],
}
