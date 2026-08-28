/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Institutional navy — nav, headings, primary action
        navy: {
          50: '#f2f6fb',
          100: '#e3ecf7',
          200: '#c5d8ef',
          300: '#97b8dd',
          400: '#6394c8',
          500: '#3f74ae',
          600: '#1e4d8c',
          700: '#1a4076',
          800: '#163461',
          900: '#0f2947',
          950: '#0a1c31',
        },
        // Semantic status colours — used ONLY for status
        approved: {
          bg: '#f0fdfa',
          border: '#99f6e4',
          fg: '#0f766e',
          solid: '#0f766e',
        },
        pending: {
          bg: '#fffbeb',
          border: '#fde68a',
          fg: '#b45309',
          solid: '#b45309',
        },
        rejected: {
          bg: '#fef2f2',
          border: '#fecaca',
          fg: '#b91c1c',
          solid: '#b91c1c',
        },
        active: {
          bg: '#eff6ff',
          border: '#bfdbfe',
          fg: '#1d4ed8',
          solid: '#1d4ed8',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 41 71 / 0.04), 0 1px 3px 0 rgb(15 41 71 / 0.06)',
        pop: '0 8px 24px -6px rgb(15 41 71 / 0.16), 0 2px 6px -2px rgb(15 41 71 / 0.08)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
}
