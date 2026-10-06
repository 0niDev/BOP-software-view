/** Invoices: sales and purchase tabs, deep-linked via ?type=.
 */
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { fetchPurchaseInvoices, fetchSalesInvoices } from '../lib/queries/invoices'
import { formatCurrency, formatDate } from '../lib/format'
import { GlassCard, ErrorState, EmptyState, TableSkeleton } from '../components/ui'
import { StatusBadge } from '../components/StatusBadge'

function InvoiceTable({ type }: { type: 'sales' | 'purchases' }) {
  const sales = useQuery({
    queryKey: ['invoices', 'sales'],
    queryFn: fetchSalesInvoices,
    enabled: type === 'sales',
  })
  const purchases = useQuery({
    queryKey: ['invoices', 'purchases'],
    queryFn: fetchPurchaseInvoices,
    enabled: type === 'purchases',
  })

  const active = type === 'sales' ? sales : purchases

  if (active.isLoading) return <TableSkeleton rows={8} cols={5} />
  if (active.isError) {
    return (
      <ErrorState
        message={active.error instanceof Error ? active.error.message : 'Could not load invoices.'}
        onRetry={() => active.refetch()}
      />
    )
  }
  const rows = active.data ?? []
  if (rows.length === 0) return <EmptyState message="No invoices in this view yet." />

  return (
    <div className="overflow-x-auto">
      <table className="tnums w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Invoice #</th>
            <th scope="col" className="py-2 pr-4 font-medium">{type === 'sales' ? 'Customer' : 'Supplier'}</th>
            <th scope="col" className="py-2 pr-4 font-medium">Date</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Total</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Balance</th>
            <th scope="col" className="py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r.invoiceNumber} className="text-fg">
              <td className="py-2.5 pr-4 font-medium text-fg-bright">{r.invoiceNumber}</td>
              <td className="max-w-[200px] truncate py-2.5 pr-4" title={r.partyName}>{r.partyName}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap">{formatDate(r.date)}</td>
              <td className="py-2.5 pr-4 text-right">{formatCurrency(r.totalAmount)}</td>
              <td className={`py-2.5 pr-4 text-right ${r.balance > 0 ? 'text-warning' : 'text-fg-muted'}`}>
                {formatCurrency(r.balance)}
              </td>
              <td className="py-2.5 text-right"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('type') === 'purchases' ? 'purchases' : 'sales'

  const setTab = (next: 'sales' | 'purchases') => {
    setSearchParams(next === 'sales' ? {} : { type: next })
  }

  const tabClass = (isActive: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-maroon-800/60 text-fg-bright'
        : 'text-fg-muted hover:bg-white/5 hover:text-fg-bright'
    }`

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-fg-bright">Invoices</h2>
          <p className="text-sm text-fg-muted">Most recent 50, cancelled excluded</p>
        </div>
        <div className="flex gap-1 rounded-2xl bg-white/5 p-1">
          <button type="button" aria-pressed={type === 'sales'} onClick={() => setTab('sales')} className={tabClass(type === 'sales')}>
            Sales
          </button>
          <button type="button" aria-pressed={type === 'purchases'} onClick={() => setTab('purchases')} className={tabClass(type === 'purchases')}>
            Purchases
          </button>
        </div>
      </header>

      <GlassCard>
        <InvoiceTable type={type} />
      </GlassCard>
    </div>
  )
}
