import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'

export function EmptyState({
  title = 'Nothing to show yet',
  hint,
  icon,
}: {
  title?: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span aria-hidden className="text-muted">
        {icon ?? <Inbox size={26} />}
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-md text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}

export default EmptyState

export function ErrorState({
  message,
  onRetry,
  title = 'Could not load this data',
}: {
  message: string
  onRetry?: () => void
  title?: string
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-6 text-center"
    >
      <AlertTriangle aria-hidden className="text-amber-ink" size={28} />
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-strong"
        >
          <RefreshCw size={14} aria-hidden />
          Try again
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />
}

export function KpiSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-[132px] rounded-card" />
      ))}
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-3 py-2 text-xs font-semibold text-danger-ink">
      {message}
    </p>
  )
}
