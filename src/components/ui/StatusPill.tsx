import type { ReactNode } from 'react'

export type PillTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'brand'

const TONE_CLASS: Record<PillTone, string> = {
  ok: 'text-ok-ink',
  warn: 'text-amber-ink',
  danger: 'text-danger-ink',
  info: 'text-teal-ink',
  neutral: 'text-muted',
  brand: 'text-brand',
}

const TONE_BG: Record<PillTone, string> = {
  ok: 'var(--ok-bg)',
  warn: 'var(--warn-bg)',
  danger: 'var(--danger-bg)',
  info: 'var(--info-bg)',
  neutral: 'var(--panel-2)',
  brand: 'var(--accent-soft)',
}

export function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE_CLASS[tone]}`}
      style={{ background: TONE_BG[tone] }}
    >
      {children}
    </span>
  )
}

/** Map a database status to a semantic tone. */
export function statusTone(value: string): PillTone {
  switch (value.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'CONFIRMED':
    case 'CLEARED':
    case 'POSTED':
    case 'ACTIVE':
    case 'TRUE':
      return 'ok'
    case 'PARTIAL':
    case 'PENDING':
    case 'DRAFT':
    case 'UNCLEARED':
    case 'IN_PROGRESS':
      return 'warn'
    case 'OVERDUE':
    case 'CANCELLED':
    case 'BOUNCED':
    case 'LOST':
    case 'INACTIVE':
    case 'FALSE':
      return 'danger'
    default:
      return 'info'
  }
}

export default function StatusPill({
  value,
  tone,
  children,
}: {
  value?: string
  tone?: PillTone
  children?: ReactNode
}) {
  const fallback = value ?? (typeof children === 'string' ? children : '')
  return <Pill tone={tone ?? statusTone(fallback)}>{children ?? value}</Pill>
}
