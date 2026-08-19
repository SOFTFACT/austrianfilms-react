import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Clapperboard,
  Award,
  Route as RouteIcon,
  Users,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@softfact/api4d-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Exact-match only — for '/', which would otherwise prefix-match everything. */
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/films', label: 'Films', icon: Clapperboard },
  { to: '/festivals', label: 'Festivals', icon: Award },
  { to: '/itineraries', label: 'Itineraries', icon: RouteIcon },
  { to: '/persons', label: 'Persons', icon: Users },
]

/** Path-active test (react-router NavLink semantics). */
function useIsActive() {
  const { pathname } = useLocation()
  return (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + '/')
}

/** Active row = sidebar-primary; overrides the primitive's default
 *  accent-based active style so active ≠ hover. */
const activeRow =
  'data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground'

function FlatNavRow({ item }: { item: NavItem }) {
  const active = useIsActive()(item.to, item.end)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={activeRow}>
        <NavLink to={item.to} end={item.end}>
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function AppSidebar() {
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
    navigate('/login', { replace: true })
  }

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar">
      <SidebarHeader>
        {/* Panel trigger (left) · brand text (flex-1). Collapsed to the icon
            rail only the centred trigger remains, so it stays a reachable
            expand button. */}
        <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:px-0">
          <SidebarTrigger className="shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:mx-auto" />
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate font-bold leading-tight tracking-tight text-sidebar-foreground">
              Austrian Films
            </div>
            <div className="truncate text-xs leading-tight text-sidebar-foreground/60">
              Backoffice
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <FlatNavRow key={item.to} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2.5 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          {/* Deliberate literal accent: the avatar gradient is a brand mark,
              not a themed surface. */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.username ?? 'User'}
            </div>
            <div className="truncate text-xs text-sidebar-foreground/60">{user?.role ?? 'user'}</div>
          </div>
        </div>
        {/* Expanded: logout (flex-1) + theme toggle in one row. Collapsed to
            the icon rail: logout as an icon button with a tooltip; theme
            toggle hidden (reachable after expanding). */}
        <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:flex-col">
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center"
            title="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
          </button>
          <ThemeToggle className="shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/** Mobile hamburger — reveals the off-canvas nav sheet. */
function NavToggle({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Toggle navigation"
      className={cn(
        'rounded-md p-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
        className,
      )}
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

export function Layout() {
  return (
    <SidebarProvider>
      {/* Desktop: full shadcn sidebar (collapsible icon rail). Mobile: the
          sidebar becomes an off-canvas sheet, opened from the dark top bar;
          quick nav lives in the fixed bottom tab bar below. */}
      <AppSidebar />
      {/* min-w-0 lets the main area shrink below its content's min-content
          width so wide children clip instead of forcing a page-wide scrollbar. */}
      <SidebarInset className="min-w-0">
        {/* Mobile dark top bar — fixed; <main> reserves pt-12 to compensate. */}
        <header className="fixed left-0 right-0 top-0 z-30 flex h-12 items-center justify-between border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground md:hidden">
          <NavToggle className="-ml-1" />
          <div className="text-sm font-bold tracking-tight">Austrian Films</div>
          <ThemeToggle className="-mr-1 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </header>

        {/* Main — reserves only the mobile top + bottom bar heights; each page
            brings its own padding. */}
        <main className="min-w-0 flex-1 pb-16 pt-12 md:pb-0 md:pt-0">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar. pb-5 = iOS safe-area. */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-sidebar-border bg-sidebar px-2 pb-5 pt-2 md:hidden"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/50',
                    )}
                  />
                  <span
                    className={cn(
                      'mt-0.5 text-[10px] leading-none',
                      isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/50',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  )
}
