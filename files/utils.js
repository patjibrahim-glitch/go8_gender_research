import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ── Data helpers ──────────────────────────────────────────────────
export function pct(n, total) {
  return total ? Math.round(n / total * 1000) / 10 : 0
}

export function fmt(n) {
  if (n == null) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

// ── Colours ───────────────────────────────────────────────────────
export const COLORS = {
  female:    '#C1440E',
  male:      '#1B4F8A',
  ambiguous: '#7A6E5F',
  single:    '#B8B0A6',
  unknown:   '#D0C8C0',
  ff:        '#C1440E',
  mm:        '#1B4F8A',
  fm:        '#6B8F71',
  mf:        '#C9963A',
  am:        '#A0836E',
  ma:        '#6E83A0',
  af:        '#D4897A',
  fa:        '#7A94B4',
  ambig:     '#7A6E5F',
}

export const UNI_COLORS = [
  '#C1440E','#1B4F8A','#6B8F71','#C9963A',
  '#7A6E5F','#4A7C8C','#8B5E3C','#3D6B4F',
]

// ── Chart defaults (for Recharts) ─────────────────────────────────
export const CHART_STYLE = {
  fontSize: 11,
  fontFamily: 'DM Mono, monospace',
  color: '#9C9590',
}
