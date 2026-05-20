import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ChartCard({ title, subtitle, footnote, children, className }) {
  return (
    <Card className={cn('rounded-none border-0 shadow-none bg-surface', className)}>
      <CardHeader className="pb-2 px-7 pt-7">
        {title && (
          <p className="font-mono text-[0.65rem] tracking-widest uppercase text-ink3">
            {title}
          </p>
        )}
        {subtitle && (
          <CardDescription className="text-sm text-ink2 leading-snug mt-1">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-7 pb-7">
        {children}
        {footnote && (
          <p className="text-xs text-ink3 leading-relaxed mt-5 pt-4 border-t border-rule">
            {footnote}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
