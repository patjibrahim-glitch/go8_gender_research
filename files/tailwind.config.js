/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg:      '#F7F4EF',
        surface: '#FFFFFF',
        ink:     '#1A1714',
        ink2:    '#5C5650',
        ink3:    '#9C9590',
        rule:    '#E2DDD8',
        female:  '#C1440E',
        male:    '#1B4F8A',
        ambig:   '#7A6E5F',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
