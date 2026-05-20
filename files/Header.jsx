import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',         label: 'Overview'  },
  { to: '/trends',   label: 'Trends'    },
  { to: '/deepdive', label: 'Deep Dive' },
  { to: '/explore',  label: 'Explore'   },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-14">
        <NavLink to="/" className="font-display text-lg tracking-tight">
          <span className="text-female">Go8</span> Gender in Research
        </NavLink>
        <nav className="flex">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'px-4 h-14 flex items-center text-xs font-medium tracking-widest uppercase transition-colors border-b-2',
                isActive
                  ? 'text-ink border-female'
                  : 'text-ink3 border-transparent hover:text-ink'
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
