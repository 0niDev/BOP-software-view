import DataTable, { type Column } from '../ui/DataTable'
import type { TopItem } from '../../lib/types'
import { formatCurrency, formatQuantity } from '../../lib/format'

const columns: Column<TopItem>[] = [
  {
    key: 'item',
    header: 'Item',
    sortValue: (row) => row.itemName,
    render: (row) => (
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-ink" title={row.itemName}>
          {row.itemName}
        </p>
        <p className="text-[11px] text-muted">{row.itemCode}</p>
      </div>
    ),
  },
  {
    key: 'quantity',
    header: 'Qty sold',
    align: 'right',
    sortValue: (row) => row.quantity,
    render: (row) => <span className="num">{formatQuantity(row.quantity)}</span>,
    hideBelow: 'sm',
  },
  {
    key: 'customers',
    header: 'Customers',
    align: 'right',
    sortValue: (row) => row.customers,
    render: (row) => <span className="num">{row.customers}</span>,
    hideBelow: 'md',
  },
  {
    key: 'revenue',
    header: 'Revenue',
    align: 'right',
    sortValue: (row) => row.revenue,
    render: (row) => <span className="num font-semibold text-ink">{formatCurrency(row.revenue)}</span>,
  },
]

export default function BestSellersTable({ rows }: { rows: TopItem[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.itemCode}
      initialSortKey="revenue"
      initialSortDir="desc"
      emptyTitle="No sales recorded yet"
      emptyHint="Best sellers appear once sales invoices are posted."
      caption="Best-selling items by revenue"
    />
  )
}
