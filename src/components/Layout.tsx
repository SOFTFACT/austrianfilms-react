import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Clapperboard, Award, Route as RouteIcon, Users, LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/lib/api4d'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '../lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/films', label: 'Films', icon: Clapperboard },
  { to: '/festivals', label: 'Festivals', icon: Award },
  { to: '/itineraries', label: 'Itineraries', icon: RouteIcon },
  { to: '/persons', label: 'Persons', icon: Users },
]

function NavLinks({ onNavTap }: { onNavTap?: () => void }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => onNavTap?.()}
          className={({ isActive }) =>
            cn(
              'mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                className={cn('h-4 w-4', isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/60')}
              />
              <span className="flex-1">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  )
}

function SidebarContent({ onNavTap }: { onNavTap?: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const initials =
    (user?.username ?? 'U')
      .split(/[\s._-]+/)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'U'

  function handleLogout() {
    logout()
    onNavTap?.()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="flex items-start justify-between border-b border-sidebar-border px-5 py-4">
        <div>
          <div className="font-bold tracking-tight text-sidebar-foreground">Austrian Films</div>
          <div className="mt-0.5 text-xs text-sidebar-foreground/60">Backoffice</div>
        </div>
        <ThemeToggle className="-mr-2 -mt-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Navigation
        </div>
        <NavLinks onNavTap={onNavTap} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          {/* Deliberate literal accent: the avatar gradient is a brand mark,
              not a themed surface. */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.username ?? 'User'}
            </div>
            <div className="text-xs text-sidebar-foreground/60">{user?.role ?? 'user'}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )
}

export function Layout() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-12 items-center justify-between border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="-ml-2 rounded p-2 hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-sm font-bold tracking-tight">Austrian Films</div>
        <ThemeToggle className="-mr-1 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 flex-shrink-0 flex-col bg-sidebar text-sm text-sidebar-foreground md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sm text-sidebar-foreground shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 rounded p-1.5 hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavTap={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-12 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
