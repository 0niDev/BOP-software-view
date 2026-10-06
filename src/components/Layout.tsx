/** App shell: sidebar navigation + header + routed page outlet. */
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  BarChart3,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/parties', label: 'Parties', icon: Users },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-maroon-800 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip To Main Content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-white/5 bg-panel/60 p-4 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-2 py-4">
          <span aria-hidden="true" className="rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-800 p-2">
            <LayoutDashboard aria-hidden="true" className="size-5 text-white" />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-fg-bright">BOP Software</h1>
            <p className="text-xs text-fg-muted">Executive Dashboard</p>
          </div>
        </div>

        <nav aria-label="Primary" className="mt-4 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-maroon-800/40 font-medium text-fg-bright'
                    : 'text-fg-muted hover:bg-white/5 hover:text-fg-bright'
                }`
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <p className="mt-auto px-2 text-xs text-fg-muted">
          BOP Nutraceuticals ERP
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex items-center gap-2 overflow-x-auto md:hidden">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  aria-label={label}
                  className={({ isActive }) =>
                    `rounded-lg p-2 transition-colors ${
                      isActive ? 'bg-maroon-800/40 text-fg-bright' : 'text-fg-muted hover:bg-white/5'
                    }`
                  }
                >
                  <Icon aria-hidden="true" className="size-5" />
                </NavLink>
              ))}
            </div>
            <h1 className="truncate text-sm font-medium text-fg-muted md:hidden">BOP Software</h1>
            <p className="hidden truncate text-sm text-fg-muted md:block">
              Live view of your ERP data, straight from SQLite Cloud
            </p>
            <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-fg-muted">
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              Live
            </span>
            <p className="sr-only">BOP Software executive dashboard</p>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 md:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
