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
        // Mapped to CSS vars for shadcn compatibility
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        ring: 'hsl(var(--ring))',
        // Semantic tokens
        bg:      '#F4F4F5',   // zinc-100
        surface: '#FFFFFF',
        ink:     '#18181B',   // zinc-900
        ink2:    '#52525B',   // zinc-600
        ink3:    '#A1A1AA',   // zinc-400
        rule:    '#E4E4E7',   // zinc-200
        female:  '#C1440E',
        male:    '#1B4F8A',
        ambig:   '#7A6E5F',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius)',
        sm: 'var(--radius)',
      },
    },
  },
  plugins: [],
}
