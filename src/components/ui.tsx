/** Small UI primitives: skeleton loaders, empty/error states, glass cards. */
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} className={`h-5 flex-1 ${j === 0 ? 'max-w-[80px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="glass rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
    >
      <AlertTriangle aria-hidden="true" className="size-8 text-warning" />
      <p className="text-sm text-fg">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-maroon-600 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-500 transition-colors"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox aria-hidden="true" className="size-8 text-fg-muted" />
      <p className="text-sm text-fg-muted">{message}</p>
    </div>
  )
}

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`glass glass-hover rounded-2xl p-5 ${className}`}
    >
      {children}
    </motion.section>
  )
}
