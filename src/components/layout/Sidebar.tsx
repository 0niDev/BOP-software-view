import type { LucideIcon } from 'lucide-react'
import {
  FileBarChart,
  History,
  LayoutDashboard,
  Leaf,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserCog,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { to: '/sales', label: 'Sales Invoices', icon: Receipt },
      { to: '/purchases', label: 'Purchase Invoices', icon: ShoppingCart },
    ],
  },
  {
    title: 'Master data',
    items: [
      { to: '/parties', label: 'Customers & Suppliers', icon: Users },
      { to: '/items', label: 'Items', icon: Package },
    ],
  },
  {
    title: 'Insights',
    items: [{ to: '/reports', label: 'Reports', icon: FileBarChart }],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: UserCog },
      { to: '/roles', label: 'Roles', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/audit', label: 'Audit Log', icon: History },
    ],
  },
]

export const NAV: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)

export default function Sidebar({
  open,
  onClose,
  companyName,
}: {
  open: boolean
  onClose: () => void
  companyName: string
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        aria-label="Modules"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-line bg-[var(--panel)] transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-4">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand text-white"
          >
            <Leaf size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-ink">BOP Nutraceuticals</p>
            <p className="truncate text-[11px] font-semibold text-muted">Executive view · read-only</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-brand-soft font-bold text-ink'
                          : 'font-medium text-muted hover:bg-surface-2 hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          strokeWidth={2.1}
                          aria-hidden
                          className={isActive ? 'text-brand' : undefined}
                        />
                        <span className="min-w-0 truncate">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-4 py-3">
          <p className="truncate text-[11px] font-bold text-ink">{companyName}</p>
          <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-muted">
            Live data from SQLite Cloud. This view never writes.
          </p>
        </div>
      </aside>
    </>
  )
}
