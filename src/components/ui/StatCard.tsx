import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const TONES = {
  brand: {
    bg: 'var(--accent-soft)',
    color: 'var(--accent)',
    outline: 'outline-brand',
  },
  teal: {
    bg: 'var(--info-bg)',
    color: 'var(--teal-ink)',
    outline: 'outline-teal',
  },
  amber: {
    bg: 'var(--warn-bg)',
    color: 'var(--amber-ink)',
    outline: 'outline-amber',
  },
  ok: {
    bg: 'var(--ok-bg)',
    color: 'var(--ok-ink)',
    outline: 'outline-teal',
  },
  danger: {
    bg: 'var(--danger-bg)',
    color: 'var(--danger-ink)',
    outline: 'outline-amber',
  },
} as const

export type StatTone = keyof typeof TONES

interface Props {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  badge?: ReactNode
  hint?: ReactNode
  tone?: StatTone
  delay?: number
}

/** One KPI tile: icon, uppercase label, big figure, optional badge and hint. */
export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  badge,
  hint,
  tone = 'brand',
  delay = 0,
}: Props) {
  const reduce = useReducedMotion()
  const styles = TONES[tone]

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className={`flex h-full min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 ${styles.outline} transition-colors duration-150`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ background: styles.bg, color: styles.color }}
        >
          <Icon size={19} strokeWidth={2.2} />
        </span>
        {badge}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="num text-[23px] font-extrabold leading-tight tracking-tight text-ink">
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-muted">{unit}</span>}
        </p>
        {hint && <p className="mt-1 text-xs font-medium leading-snug text-muted">{hint}</p>}
      </div>
    </motion.article>
  )
}
