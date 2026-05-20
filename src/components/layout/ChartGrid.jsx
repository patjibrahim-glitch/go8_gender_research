import { cn } from '@/lib/utils'

export default function ChartGrid({ children, cols = 2, className }) {
  return (
    <div className={cn(
      'grid gap-px bg-rule border border-rule mb-10',
      cols === 1 && 'grid-cols-1',
      cols === 2 && 'grid-cols-1 lg:grid-cols-2',
      cols === 3 && 'grid-cols-1 lg:grid-cols-3',
      className
    )}>
      {children}
    </div>
  )
}
