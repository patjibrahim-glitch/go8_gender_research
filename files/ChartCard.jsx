import { cn } from '@/lib/utils'

export default function ChartCard({ title, subtitle, footnote, children, className }) {
  return (
    <div className={cn('bg-surface p-7', className)}>
      {title && (
        <p className="font-mono text-[0.68rem] tracking-widest uppercase text-ink3 mb-1">
          {title}
        </p>
      )}
      {subtitle && (
        <p className="text-sm text-ink2 leading-snug mb-5">{subtitle}</p>
      )}
      {children}
      {footnote && (
        <p className="text-xs text-ink3 leading-relaxed mt-4 pt-4 border-t border-rule">
          {footnote}
        </p>
      )}
    </div>
  )
}
