import { CalendarClock } from 'lucide-react'
import type { ExpiringItem } from '../../lib/types'
import { formatDate, formatQuantity } from '../../lib/format'
import { EmptyState } from '../ui/States'

export default function ExpiringTable({ rows }: { rows: ExpiringItem[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock size={26} />}
        title="No batches expiring soon"
        hint="Batches with stock on hand and an expiry date within the next 30 days appear here."
      />
    )
  }

  return (
    <ul className="divide-y divide-line/60">
      {rows.map((row) => (
        <li key={`${row.batchNumber}-${row.itemCode}`} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-ink" title={row.itemName}>
              {row.itemName}
            </p>
            <p className="truncate text-[11px] text-muted">
              {row.batchNumber} · {formatQuantity(row.quantityInStock)} {row.unit.toLowerCase()}
            </p>
          </div>
          <span className="num shrink-0 text-[12px] font-bold text-danger-ink">
            {formatDate(row.expiryDate)}
          </span>
        </li>
      ))}
    </ul>
  )
}
