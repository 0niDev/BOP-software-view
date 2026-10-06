/** Inventory: stock on hand, value and low-stock flags. */
import { useQuery } from '@tanstack/react-query'
import { Boxes, TriangleAlert, CircleDollarSign } from 'lucide-react'
import { fetchStock } from '../lib/queries/inventory'
import { formatCurrency, formatNumber } from '../lib/format'
import { GlassCard, ErrorState, EmptyState, TableSkeleton } from '../components/ui'
import { StatCard } from '../components/StatCard'

export default function InventoryPage() {
  const stock = useQuery({ queryKey: ['stock'], queryFn: fetchStock })

  const rows = stock.data ?? []
  const totalValue = rows.reduce((sum, r) => sum + r.stockValue, 0)
  const lowCount = rows.filter((r) => r.isLow).length

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-fg-bright">Inventory</h2>
        <p className="text-sm text-fg-muted">Stock on hand across active batches</p>
      </header>

      {stock.isError ? (
        <ErrorState
          message={stock.error instanceof Error ? stock.error.message : 'Could not load inventory.'}
          onRetry={() => stock.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={CircleDollarSign} label="Total Stock Value" value={stock.isLoading ? 'Loading…' : formatCurrency(totalValue)} accent="success" />
          <StatCard icon={Boxes} label="Tracked Items" value={stock.isLoading ? 'Loading…' : formatNumber(rows.length)} accent="info" />
          <StatCard icon={TriangleAlert} label="Low Stock Items" value={stock.isLoading ? 'Loading…' : formatNumber(lowCount)} accent={lowCount > 0 ? 'danger' : 'success'} />
        </div>
      )}

      <GlassCard>
        <h3 className="mb-4 text-sm font-semibold text-fg-bright">Stock On Hand</h3>
        {stock.isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : stock.isError ? null : rows.length === 0 ? (
          <EmptyState message="No active items with stock batches." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tnums w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Code</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Item</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Unit</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Stock</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Min.</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Value</th>
                  <th scope="col" className="py-2 text-right font-medium">Batches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.itemCode} className="text-fg">
                    <td className="py-2.5 pr-4 font-medium text-fg-bright">{r.itemCode}</td>
                    <td className="max-w-[240px] truncate py-2.5 pr-4" title={r.itemName}>{r.itemName}</td>
                    <td className="py-2.5 pr-4">{r.unit}</td>
                    <td className={`py-2.5 pr-4 text-right font-medium ${r.isLow ? 'text-warning' : 'text-fg'}`}>
                      {formatNumber(r.totalStock)}
                      {r.isLow && (
                        <>
                          <TriangleAlert aria-hidden="true" className="ml-1.5 inline size-3.5" />
                          <span className="sr-only"> — at or below minimum stock</span>
                        </>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-fg-muted">{formatNumber(r.minimumStock)}</td>
                    <td className="py-2.5 pr-4 text-right">{formatCurrency(r.stockValue)}</td>
                    <td className="py-2.5 text-right">{formatNumber(r.batchCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
