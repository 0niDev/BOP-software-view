import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Banknote, CircleDollarSign, Clock3, Download, FileText } from 'lucide-react'
import { fetchInvoiceDetail, fetchInvoices, invoiceStats } from '../lib/queries/invoices'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatQuantity,
  titleCase,
} from '../lib/format'
import { downloadCsv } from '../lib/download'
import type { InvoiceKind, InvoiceRow } from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import Drawer from '../components/ui/Drawer'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { ErrorState, Skeleton } from '../components/ui/States'
import FilterBox from '../components/FilterBox'

function statusOptions(rows: InvoiceRow[]): string[] {
  return [...new Set(rows.map((row) => row.status))].sort()
}

function InvoiceDetailView({ kind, invoiceId }: { kind: InvoiceKind; invoiceId: number }) {
  const detail = useQuery({
    queryKey: ['invoice-detail', kind, invoiceId],
    queryFn: () => fetchInvoiceDetail(kind, invoiceId),
  })

  if (detail.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }
  if (detail.isError) {
    return (
      <ErrorState
        message={detail.error instanceof Error ? detail.error.message : 'Could not load the invoice.'}
        onRetry={() => detail.refetch()}
      />
    )
  }
  if (!detail.data) return null

  const { invoice, items } = detail.data

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Party</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{invoice.partyName}</p>
          <p className="text-[11px] text-muted">{invoice.partyCode}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Date</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{formatDate(invoice.date)}</p>
          <p className="text-[11px] text-muted">{titleCase(invoice.paymentType)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Status</p>
          <div className="mt-0.5">
            <StatusPill value={invoice.status} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{invoice.warehouse ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Subtotal</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ink">{formatCurrency(invoice.subtotal)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Discount</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ink">{formatCurrency(invoice.discountAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Tax</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ink">{formatCurrency(invoice.taxAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Total</p>
          <p className="num mt-0.5 text-[13px] font-extrabold text-ink">{formatCurrency(invoice.totalAmount)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <span className="text-muted">
          Paid <span className="num font-bold text-ok-ink">{formatCurrency(invoice.paidAmount)}</span>
        </span>
        <span className="text-muted">
          Balance{' '}
          <span className={`num font-bold ${invoice.balance > 0.01 ? 'text-amber-ink' : 'text-ink'}`}>
            {formatCurrency(invoice.balance)}
          </span>
        </span>
      </div>

      {invoice.notes && (
        <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted">{invoice.notes}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className="text-right">Qty</th>
              <th scope="col" className="text-right">Unit price</th>
              <th scope="col" className="text-right">Discount</th>
              <th scope="col" className="text-right">Line total</th>
              <th scope="col" className="hidden md:table-cell">Batch</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-muted">
                  No line items recorded for this invoice.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="text-[12px] font-bold text-ink">{item.itemName}</p>
                    <p className="text-[10px] text-muted">{item.itemCode}</p>
                  </td>
                  <td className="num text-right">
                    {formatQuantity(item.quantity)} {item.unit.toLowerCase()}
                  </td>
                  <td className="num text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="num text-right">{formatCurrency(item.discountAmount)}</td>
                  <td className="num text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
                  <td className="hidden md:table-cell">
                    <p className="text-[11px] text-muted">{item.batchNumber ?? '—'}</p>
                    {item.expiryDate && (
                      <p className="text-[10px] text-muted">exp {formatDate(item.expiryDate)}</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Invoice total
              </td>
              <td className="num py-2.5 text-right text-[13px] font-extrabold text-ink">
                {formatCurrency(invoice.totalAmount)}
              </td>
              <td className="hidden md:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function InvoiceListPage({ kind }: { kind: InvoiceKind }) {
  const isSales = kind === 'sales'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const invoices = useQuery({
    queryKey: ['invoices', kind],
    queryFn: () => fetchInvoices(kind),
  })

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (invoices.data ?? []).filter((row) => {
      if (status && row.status !== status) return false
      if (paymentType && row.paymentType !== paymentType) return false
      if (!needle) return true
      return (
        row.invoiceNumber.toLowerCase().includes(needle) ||
        row.partyName.toLowerCase().includes(needle) ||
        row.partyCode.toLowerCase().includes(needle)
      )
    })
  }, [invoices.data, search, status, paymentType])

  const stats = invoiceStats(rows)
  const allRows = invoices.data ?? []

  const columns: Column<InvoiceRow>[] = [
    {
      key: 'invoice',
      header: 'Invoice #',
      sortValue: (row) => row.invoiceNumber,
      render: (row) => <span className="font-bold text-ink">{row.invoiceNumber}</span>,
    },
    {
      key: 'party',
      header: isSales ? 'Customer' : 'Supplier',
      sortValue: (row) => row.partyName,
      render: (row) => (
        <div className="min-w-0 max-w-[160px] sm:max-w-none">
          <p className="truncate text-[13px] font-semibold text-ink" title={row.partyName}>
            {row.partyName}
          </p>
          <p className="text-[10px] text-muted">{row.partyCode}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortValue: (row) => row.date,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatDate(row.date)}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'payment',
      header: 'Payment',
      sortValue: (row) => row.paymentType,
      render: (row) => <span className="text-[11px] font-semibold text-muted">{titleCase(row.paymentType)}</span>,
      hideBelow: 'lg',
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortValue: (row) => row.totalAmount,
      render: (row) => (
        <div className="text-right">
          <span className="num whitespace-nowrap font-semibold text-ink">
            {formatCurrency(row.totalAmount)}
          </span>
          <span
            className={`block text-[10px] font-semibold sm:hidden ${
              row.balance > 0.01 ? 'text-amber-ink' : 'text-muted'
            }`}
          >
            {row.balance > 0.01 ? `${formatCurrency(row.balance)} due` : 'Settled'}
          </span>
        </div>
      ),
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      sortValue: (row) => row.paidAmount,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatCurrency(row.paidAmount)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      sortValue: (row) => row.balance,
      render: (row) => (
        <span className={`num font-semibold ${row.balance > 0.01 ? 'text-amber-ink' : 'text-muted'}`}>
          {formatCurrency(row.balance)}
        </span>
      ),
      hideBelow: 'sm',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (row) => row.status,
      render: (row) => <StatusPill value={row.status} />,
      hideBelow: 'sm',
    },
  ]

  const title = isSales ? 'Sales Invoices' : 'Purchase Invoices'
  const subtitle = isSales
    ? 'Customer invoices, payments and outstanding balances'
    : 'Supplier invoices, payments and outstanding balances'

  const exportRows = (): void => {
    downloadCsv(
      `${kind}-invoices.csv`,
      rows.map((row) => ({
        invoice: row.invoiceNumber,
        party: row.partyName,
        date: row.date,
        paymentType: row.paymentType,
        total: row.totalAmount,
        paid: row.paidAmount,
        balance: row.balance,
        status: row.status,
      })),
      [
        { key: 'invoice', label: 'Invoice #' },
        { key: 'party', label: isSales ? 'Customer' : 'Supplier' },
        { key: 'date', label: 'Date' },
        { key: 'paymentType', label: 'Payment type' },
        { key: 'total', label: 'Total' },
        { key: 'paid', label: 'Paid' },
        { key: 'balance', label: 'Balance' },
        { key: 'status', label: 'Status' },
      ],
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Operations"
        title={title}
        subtitle={subtitle}
        actions={
          <button
            type="button"
            onClick={exportRows}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
          >
            <Download size={14} aria-hidden />
            Export CSV
          </button>
        }
      />

      {invoices.isError ? (
        <ErrorState
          message={invoices.error instanceof Error ? invoices.error.message : 'Could not load invoices.'}
          onRetry={() => invoices.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Invoices"
              value={formatNumber(stats.count)}
              hint={isSales ? 'Customer invoices' : 'Supplier invoices'}
              tone="brand"
            />
            <StatCard
              icon={CircleDollarSign}
              label="Total value"
              value={formatCurrency(stats.total)}
              hint="Including tax and discount"
              tone="teal"
            />
            <StatCard
              icon={Banknote}
              label="Paid"
              value={formatCurrency(stats.paid)}
              hint={`${stats.total ? Math.round((stats.paid / stats.total) * 100) : 0}% settled`}
              tone="ok"
            />
            <StatCard
              icon={Clock3}
              label="Outstanding"
              value={formatCurrency(stats.outstanding)}
              hint="Unpaid balance"
              tone={stats.outstanding > 0 ? 'amber' : 'ok'}
            />
          </div>

          <Card
            title={`${title} list`}
            subtitle={`${formatNumber(rows.length)} of ${formatNumber(allRows.length)} invoices`}
            action={
              <div className="flex flex-wrap items-end gap-2">
                <FilterBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search invoice or party…"
                  className="w-full sm:w-[190px]"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Filter by status"
                  className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">All statuses</option>
                  {statusOptions(allRows).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value)}
                  aria-label="Filter by payment type"
                  className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">All payments</option>
                  {[...new Set(allRows.map((row) => row.paymentType))].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            {invoices.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-9 rounded-md" />
                ))}
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  rows={rows}
                  rowKey={(row) => row.id}
                  initialSortKey="date"
                  initialSortDir="desc"
                  pageSize={25}
                  onRowClick={(row) => setSelected(row.id)}
                  emptyTitle="No invoices match these filters"
                  emptyHint="Clear the search or filters, or wait for the ERP to post invoices."
                  caption={title}
                />

              </>
            )}
            <p className="mt-3 text-[11px] text-muted">
              Click a row to open the invoice line items.
            </p>
          </Card>
        </>
      )}

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={isSales ? 'Sales invoice' : 'Purchase invoice'}
        subtitle="Read-only detail · line items, batch and settlement"
        width="wide"
      >
        {selected != null && <InvoiceDetailView kind={kind} invoiceId={selected} />}
      </Drawer>
    </div>
  )
}

export { InvoiceListPage }
