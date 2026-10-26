import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  compact?: boolean
  outline?: 'brand' | 'teal' | 'amber'
  delay?: number
}

/**
 * The dashboard surface: a flat matte panel with a hairline border and an
 * optional razor-thin accent outline. No shadows, no gradients.
 */
export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName,
  compact = false,
  outline,
  delay = 0,
}: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className={`min-w-0 rounded-card border border-line bg-surface p-5 transition-colors duration-150 ${
        outline ? `outline-${outline}` : ''
      } ${className}`}
    >
      {(title || action) && (
        <header className={`flex items-start justify-between gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
          <div className="min-w-0">
            {title && (
              <h2
                style={{ margin: 0, fontSize: compact ? 14 : 16 }}
                className="font-bold tracking-tight text-ink"
              >
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-xs font-medium text-muted">{subtitle}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  )
}
