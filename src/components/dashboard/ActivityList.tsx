import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Receipt, ShoppingCart, Wallet } from 'lucide-react'
import type { RecentTransaction } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/format'
import { EmptyState } from '../ui/States'

const META: Record<
  RecentTransaction['type'],
  { icon: typeof Receipt; color: string; bg: string; to: string | null }
> = {
  Sales: { icon: Receipt, color: 'var(--ok-ink)', bg: 'var(--ok-bg)', to: '/sales' },
  Purchases: { icon: ShoppingCart, color: 'var(--amber-ink)', bg: 'var(--warn-bg)', to: '/purchases' },
  Payment: { icon: Wallet, color: 'var(--danger-ink)', bg: 'var(--danger-bg)', to: '/parties' },
  Receipt: { icon: Wallet, color: 'var(--teal-ink)', bg: 'var(--info-bg)', to: '/parties' },
  Expense: { icon: Wallet, color: 'var(--muted)', bg: 'var(--panel-2)', to: null },
}

export default function ActivityList({ rows }: { rows: RecentTransaction[] }) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        hint="Sales, purchases, payments, receipts and expenses will appear here as the ERP records them."
      />
    )
  }

  return (
    <ul className="divide-y divide-line/60">
      {rows.map((row, index) => {
        const meta = META[row.type] ?? META.Expense
        const Icon = meta.icon
        const clickable = Boolean(meta.to)
        return (
          <li key={`${row.type}-${row.reference}-${index}`}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => meta.to && navigate(meta.to)}
              className={`flex w-full items-center gap-3 py-2.5 text-left transition-colors ${
                clickable ? 'hover:bg-surface-2' : 'cursor-default'
              }`}
            >
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ background: meta.bg, color: meta.color }}
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-[13px] font-bold text-ink">{row.reference}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                    {row.type}
                  </span>
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {row.partyName ?? '—'} · {formatDate(row.date)}
                </span>
              </span>
              <span className="num shrink-0 text-[13px] font-bold text-ink">
                {formatCurrency(row.amount)}
              </span>
              {clickable && <ArrowUpRight size={13} className="shrink-0 text-muted" aria-hidden />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
