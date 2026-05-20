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
  female:    '#84cc16',   // lime-500
  male:      '#1B4F8A',
  ambiguous: '#A1A1AA',
  single:    '#D4D4D8',
  unknown:   '#E4E4E7',
  ff:        '#84cc16',
  mm:        '#1B4F8A',
  fm:        '#22d3ee',
  mf:        '#f59e0b',
  am:        '#a3e635',
  ma:        '#7C3AED',
  af:        '#86efac',
  fa:        '#c4b5fd',
  ambig:     '#A1A1AA',
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
