import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const NAV = [
  { to: '/',         label: 'Overview'  },
  { to: '/trends',   label: 'Trends'    },
  { to: '/deepdive', label: 'Deep Dive' },
  { to: '/explore',  label: 'Explore'   },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-rule">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-14">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="font-display text-base tracking-tight">
            <span className="text-female">Go8</span>
            <span className="text-ink"> Gender in Research</span>
          </span>
        </NavLink>

        <nav className="flex items-center">
          {NAV.map(({ to, label }, i) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'relative px-4 h-14 flex items-center font-mono text-[0.68rem] tracking-widest uppercase transition-colors',
                'after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[2px] after:transition-all',
                isActive
                  ? 'text-ink after:bg-female'
                  : 'text-ink3 hover:text-ink2 after:bg-transparent'
              )}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
