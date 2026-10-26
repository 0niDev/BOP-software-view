import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import Sidebar from './layout/Sidebar'
import TopBar from './layout/TopBar'
import { fetchCompany, fetchThemeSetting } from '../lib/queries/meta'
import { fetchDashboard } from '../lib/queries/dashboard'
import { applyTheme, readStoredTheme, writeStoredTheme, type ThemeMode } from '../lib/theme'

export default function Layout() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const reduce = useReducedMotion()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme() ?? 'dark')
  const userSetTheme = useRef(readStoredTheme() !== null)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  // Apply the active theme and persist an explicit user choice.
  useEffect(() => {
    applyTheme(theme)
    if (userSetTheme.current) writeStoredTheme(theme)
  }, [theme])

  // First visit: adopt the theme stored in the ERP's APPEARANCE setting.
  useEffect(() => {
    if (userSetTheme.current) return
    let cancelled = false
    fetchThemeSetting()
      .then((stored) => {
        if (!cancelled && stored) setTheme(stored)
      })
      .catch(() => {
        /* the default dark theme is fine */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // "System" follows the OS while the view is open.
  useEffect(() => {
    if (!window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const listener = (): void => {
      if (theme === 'system') applyTheme('system')
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const company = useQuery({
    queryKey: ['company'],
    queryFn: fetchCompany,
    staleTime: 10 * 60_000,
  })

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 2 * 60_000,
  })

  const refreshing = company.isFetching || dashboard.isFetching

  const refresh = (): void => {
    void queryClient.invalidateQueries()
    setLastUpdated(new Date())
  }

  const companyName = company.data?.name ?? 'BOP Nutraceuticals'

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} companyName={companyName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          companyName={companyName}
          theme={theme}
          onThemeChange={(next) => {
            userSetTheme.current = true
            setTheme(next)
          }}
          onRefresh={refresh}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          alerts={dashboard.data?.alerts ?? []}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main id="main" className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            <motion.div
              key={location.pathname}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex min-w-0 flex-col gap-5"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>

        <footer className="border-t border-line px-4 py-4 text-[11px] font-medium text-muted sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
            <span>{companyName} · Executive view</span>
            <span>Read-only · amounts in PKR</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
