import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App'
import './index.css'

// Preconnect to the SQLite Cloud host before the first query fires.
// Derived from env (never hardcoded) so credentials/host stay in .env*.
const dbUrl = import.meta.env.VITE_SQLITECLOUD_URL
if (dbUrl) {
  try {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = new URL(dbUrl).origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  } catch {
    // Invalid VITE_SQLITECLOUD_URL — queries will surface the error anyway.
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Honors prefers-reduced-motion for every framer-motion animation. */}
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
)
