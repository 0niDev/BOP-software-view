import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Command,
  Menu,
  Monitor,
  Moon,
  RefreshCw,
  Search,
  Sun,
} from 'lucide-react'
import { NAV } from './Sidebar'
import type { DashboardAlert } from '../../lib/types'
import { nextTheme, type ThemeMode } from '../../lib/theme'
import { formatDateTime } from '../../lib/format'

const THEME_LABEL: Record<ThemeMode, string> = {
  dark: 'Dark theme',
  light: 'Light theme',
  system: 'System theme',
}

const THEME_ICON = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} as const

export default function TopBar({
  companyName,
  theme,
  onThemeChange,
  onRefresh,
  refreshing,
  lastUpdated,
  alerts,
  onOpenSidebar,
}: {
  companyName: string
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  onRefresh: () => void
  refreshing: boolean
  lastUpdated: Date
  alerts: DashboardAlert[]
  onOpenSidebar: () => void
}) {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return []
    return NAV.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 6)
  }, [search])

  // Ctrl+K focuses the module finder.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Close popovers on an outside click.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node
      if (searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setSearchOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const ThemeIcon = THEME_ICON[theme]
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const alertCount = alerts.filter((alert) => alert.type !== 'success').length
  const visibleAlerts = alerts.filter((alert) => alert.type !== 'success').slice(0, 5)

  return (
    <header className="topbar sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted transition-colors hover:text-ink lg:hidden"
        >
          <Menu size={18} aria-hidden />
        </button>

        <div className="hidden min-w-0 md:block">
          <p className="truncate text-[13px] font-bold text-ink">{companyName}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Read-only executive view
          </p>
        </div>

        <div ref={searchWrapRef} className="relative ml-auto w-full max-w-[340px] md:ml-6">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
            <Search size={15} />
          </span>
          <input
            ref={searchRef}
            type="search"
            value={search}
            autoComplete="off"
            placeholder="Find a page…"
            aria-label="Find a page"
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value)
              setSearchOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && matches[0]) {
                navigate(matches[0].to)
                setSearch('')
                setSearchOpen(false)
                searchRef.current?.blur()
              }
            }}
            className="w-full rounded-lg border border-line bg-[var(--input-bg)] py-1.5 pl-9 pr-16 text-[13px] text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted sm:flex">
            {isMac ? (
              <>
                <Command size={10} aria-hidden />K
              </>
            ) : (
              'Ctrl K'
            )}
          </span>
          {searchOpen && search.trim() !== '' && (
            <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-[var(--shadow-float)]">
              {matches.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-muted">No page matches.</p>
              ) : (
                matches.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        navigate(item.to)
                        setSearch('')
                        setSearchOpen(false)
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-surface-2"
                    >
                      <Icon size={15} className="text-muted" aria-hidden />
                      {item.label}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => setBellOpen((value) => !value)}
              aria-label={`Notifications${alertCount ? ` (${alertCount})` : ''}`}
              aria-expanded={bellOpen}
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-2 text-muted transition-colors hover:text-ink"
            >
              <Bell size={17} aria-hidden />
              {alertCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
                >
                  {alertCount}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 z-40 mt-1 w-[320px] overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-float)]">
                <p className="border-b border-line px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {alertCount ? `${alertCount} alert${alertCount === 1 ? '' : 's'}` : 'Notifications'}
                </p>
                {visibleAlerts.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted">Nothing needs attention.</p>
                ) : (
                  visibleAlerts.map((alert, index) => (
                    <div key={`${alert.title}-${index}`} className="flex gap-2 border-b border-line/60 px-3 py-2.5 last:border-b-0">
                      <span
                        aria-hidden
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background:
                            alert.type === 'danger'
                              ? 'var(--danger)'
                              : alert.type === 'warning'
                                ? 'var(--amber)'
                                : 'var(--teal)',
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink">{alert.title}</p>
                        <p className="text-[11px] leading-snug text-muted">{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => {
                    setBellOpen(false)
                    navigate('/')
                  }}
                  className="w-full border-t border-line px-3 py-2 text-left text-xs font-bold text-brand transition-colors hover:bg-surface-2"
                >
                  Open the dashboard
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onThemeChange(nextTheme(theme))}
            aria-label={THEME_LABEL[theme]}
            title={THEME_LABEL[theme]}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-2 text-muted transition-colors hover:text-ink"
          >
            <ThemeIcon size={17} aria-hidden />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh data"
            title={`Last updated ${formatDateTime(lastUpdated.toISOString())}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 text-xs font-bold text-muted transition-colors hover:text-ink sm:px-3"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : undefined} aria-hidden />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
