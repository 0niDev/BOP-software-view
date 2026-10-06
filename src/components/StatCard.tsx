/** Animated KPI card for the dashboard. */
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const accents = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  maroon: 'text-maroon-500',
} as const

export type Accent = keyof typeof accents

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'maroon',
  index = 0,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  accent?: Accent
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
      className="glass glass-hover rounded-2xl p-5 min-w-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-fg-muted">{label}</p>
          <p className="tnums mt-2 truncate text-2xl font-semibold text-fg-bright" title={value}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-fg-muted">{sub}</p>}
        </div>
        <span
          aria-hidden="true"
          className={`rounded-xl bg-white/5 p-2.5 ${accents[accent]}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </motion.div>
  )
}
