import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { formatPercent } from '../../lib/format'

/**
 * Month-on-month change badge. `invert` treats an increase as bad (expenses).
 * A null change renders a neutral dash rather than a fake infinity.
 */
export default function DeltaPill({
  change,
  label,
  invert = false,
}: {
  change: number | null
  label?: string
  invert?: boolean
}) {
  if (change == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
        <Minus size={11} aria-hidden />
        {label ? `${label} —` : '—'}
      </span>
    )
  }

  const good = invert ? change <= 0 : change >= 0
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight
  const tone = change === 0 ? 'text-muted' : good ? 'text-ok-ink' : 'text-danger-ink'
  const bg = change === 0 ? 'bg-surface-2' : good ? 'bg-[var(--ok-bg)]' : 'bg-[var(--danger-bg)]'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone} ${bg}`}
      title={label ? `${label} change` : undefined}
    >
      <Icon size={12} aria-hidden />
      {formatPercent(change)}
      {label && <span className="font-semibold opacity-80">{label}</span>}
    </span>
  )
}
