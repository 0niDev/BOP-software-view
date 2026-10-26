import { TriangleAlert } from 'lucide-react'
import type { LowStockItem } from '../../lib/types'
import { formatQuantity } from '../../lib/format'
import { EmptyState } from '../ui/States'

export default function LowStockTable({
  rows,
  totalItems,
}: {
  rows: LowStockItem[]
  totalItems: number
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<TriangleAlert size={26} />}
        title="No low-stock items"
        hint={`All ${totalItems} active items are at or above their minimum stock level.`}
      />
    )
  }

  return (
    <ul className="divide-y divide-line/60">
      {rows.map((row) => (
        <li key={row.itemCode} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-ink" title={row.itemName}>
              {row.itemName}
            </p>
            <p className="text-[11px] text-muted">{row.itemCode}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="num text-[13px] font-bold text-amber-ink">
              {formatQuantity(row.currentStock)} {row.unit.toLowerCase()}
            </p>
            <p className="num text-[10px] text-muted">min {formatQuantity(row.minimumStock)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
