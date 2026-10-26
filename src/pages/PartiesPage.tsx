import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Scale, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { fetchPartiesSummary, fetchPartyLedger } from '../lib/queries/parties'
import { formatCurrency, formatDate, formatNumber, titleCase } from '../lib/format'
import { downloadCsv } from '../lib/download'
import type { PartySummary } from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import Drawer from '../components/ui/Drawer'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import FilterBox from '../components/FilterBox'

const TYPE_FILTERS = [
  { value: '', label: 'All parties' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'SUPPLIER', label: 'Suppliers' },
  { value: 'RECEIVABLE', label: 'With receivable' },
  { value: 'PAYABLE', label: 'With payable' },
] as const

type TypeFilter = (typeof TYPE_FILTERS)[number]['value']

function kindTone(kind: PartySummary['kind']): 'ok' | 'warn' | 'neutral' {
  return kind === 'Receivable' ? 'ok' : kind === 'Payable' ? 'warn' : 'neutral'
}

function PartyTypePill({ value }: { value: string }) {
  const tone = value === 'CUSTOMER' ? 'info' : value === 'SUPPLIER' ? 'warn' : 'brand'
  return <StatusPill value={titleCase(value)} tone={tone} />
}

function LedgerView({ partyId }: { partyId: number }) {
  const ledger = useQuery({
    queryKey: ['party-ledger', partyId],
    queryFn: () => fetchPartyLedger(partyId),
  })

  if (ledger.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }
  if (ledger.isError) {
    return (
      <ErrorState
        message={ledger.error instanceof Error ? ledger.error.message : 'Could not load the ledger.'}
        onRetry={() => ledger.refetch()}
      />
    )
  }
  if (!ledger.data) return null

  const data = ledger.data
  const closingTone =
    Math.abs(data.closingBalance) < 0.01
      ? 'text-ink'
      : data.isCustomer
        ? data.closingBalance > 0
          ? 'text-ok-ink'
          : 'text-amber-ink'
        : data.closingBalance > 0
          ? 'text-amber-ink'
          : 'text-ok-ink'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line bg-surface-2 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{data.party.name}</p>
          <p className="text-[11px] text-muted">
            {data.party.code} · {titleCase(data.party.partyType)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Closing balance</p>
          <p className={`num text-lg font-extrabold ${closingTone}`}>{formatCurrency(data.closingBalance)}</p>
          <p className="text-[10px] text-muted">{data.balanceLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-line p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Opening</p>
          <p className="num mt-1 text-[13px] font-bold text-ink">{formatCurrency(data.openingBalance)}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Debit</p>
          <p className="num mt-1 text-[13px] font-bold text-ink">{formatCurrency(data.totalDebit)}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Credit</p>
          <p className="num mt-1 text-[13px] font-bold text-ink">{formatCurrency(data.totalCredit)}</p>
        </div>
      </div>

      {data.entries.length === 0 ? (
        <EmptyState
          title="No ledger entries"
          hint="This party has an opening balance only — no invoices or payments have posted to the ledger yet."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Voucher</th>
                <th scope="col">Description</th>
                <th scope="col" className="text-right">Debit</th>
                <th scope="col" className="text-right">Credit</th>
                <th scope="col" className="text-right">Running</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, index) => (
                <tr key={`${entry.voucherNumber}-${index}`}>
                  <td className="num whitespace-nowrap text-muted">{formatDate(entry.date)}</td>
                  <td>
                    <p className="text-[11px] font-bold text-ink">{entry.voucherNumber}</p>
                    <p className="text-[10px] text-muted">{entry.voucherType}</p>
                  </td>
                  <td className="max-w-[220px]">
                    <p className="truncate text-[12px] text-ink" title={entry.description}>
                      {entry.description}
                    </p>
                    <p className="text-[10px] text-muted">{entry.accountName}</p>
                  </td>
                  <td className="num text-right text-muted">
                    {entry.debit ? formatCurrency(entry.debit) : '—'}
                  </td>
                  <td className="num text-right text-muted">
                    {entry.credit ? formatCurrency(entry.credit) : '—'}
                  </td>
                  <td className="num text-right font-bold text-ink">{formatCurrency(entry.running)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                  Period totals
                </td>
                <td className="num py-2.5 text-right text-[12px] font-bold text-ink">
                  {formatCurrency(data.totalDebit)}
                </td>
                <td className="num py-2.5 text-right text-[12px] font-bold text-ink">
                  {formatCurrency(data.totalCredit)}
                </td>
                <td className="num py-2.5 text-right text-[12px] font-extrabold text-ink">
                  {formatCurrency(data.closingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted">
        Customer balances are debit − credit. Supplier balances are credit − debit. OPENING vouchers are
        shown as the opening balance and excluded from period entries to avoid double counting.
      </p>
    </div>
  )
}

export default function PartiesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('')
  const [selected, setSelected] = useState<PartySummary | null>(null)

  const summary = useQuery({
    queryKey: ['parties-summary'],
    queryFn: fetchPartiesSummary,
  })

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (summary.data?.parties ?? []).filter((party) => {
      if (typeFilter === 'CUSTOMER' && !(party.partyType === 'CUSTOMER' || party.partyType === 'BOTH')) return false
      if (typeFilter === 'SUPPLIER' && !(party.partyType === 'SUPPLIER' || party.partyType === 'BOTH')) return false
      if (typeFilter === 'RECEIVABLE' && party.kind !== 'Receivable') return false
      if (typeFilter === 'PAYABLE' && party.kind !== 'Payable') return false
      if (!needle) return true
      return (
        party.name.toLowerCase().includes(needle) ||
        party.code.toLowerCase().includes(needle) ||
        (party.phone ?? '').toLowerCase().includes(needle)
      )
    })
  }, [summary.data, search, typeFilter])

  const columns: Column<PartySummary>[] = [
    {
      key: 'party',
      header: 'Party',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-ink" title={row.name}>
            {row.name}
          </p>
          <p className="text-[10px] text-muted">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (row) => row.partyType,
      render: (row) => <PartyTypePill value={row.partyType} />,
      hideBelow: 'sm',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-[11px] text-muted">{row.phone ?? '—'}</span>,
      hideBelow: 'lg',
    },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      sortValue: (row) => row.debit,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatCurrency(row.debit)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      sortValue: (row) => row.credit,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatCurrency(row.credit)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      sortValue: (row) => row.balance,
      render: (row) => (
        <div className="text-right">
          <span
            className={`num whitespace-nowrap font-bold ${
              row.kind === 'Receivable'
                ? 'text-ok-ink'
                : row.kind === 'Payable'
                  ? 'text-amber-ink'
                  : 'text-muted'
            }`}
          >
            {formatCurrency(row.balance)}
          </span>
          <span className="block text-[10px] font-semibold text-muted sm:hidden">{row.kind}</span>
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'Position',
      align: 'right',
      sortValue: (row) => row.kind,
      render: (row) => <StatusPill value={row.kind} tone={kindTone(row.kind)} />,
      hideBelow: 'sm',
    },
  ]

  const stats = summary.data

  const exportRows = (): void => {
    downloadCsv(
      'parties.csv',
      rows.map((row) => ({
        code: row.code,
        name: row.name,
        type: row.partyType,
        phone: row.phone,
        debit: row.debit,
        credit: row.credit,
        balance: row.balance,
        position: row.kind,
      })),
      [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'phone', label: 'Phone' },
        { key: 'debit', label: 'Debit' },
        { key: 'credit', label: 'Credit' },
        { key: 'balance', label: 'Balance' },
        { key: 'position', label: 'Position' },
      ],
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Master data"
        title="Customers & Suppliers"
        subtitle="Journal-derived balances for every active party"
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

      {summary.isError ? (
        <ErrorState
          message={summary.error instanceof Error ? summary.error.message : 'Could not load parties.'}
          onRetry={() => summary.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Active parties"
              value={formatNumber(stats?.parties.length ?? 0)}
              hint="Customers, suppliers and both"
              tone="brand"
            />
            <StatCard
              icon={TrendingUp}
              label="Receivable"
              value={formatCurrency(stats?.receivable ?? 0)}
              hint="Customers owe us"
              tone="ok"
            />
            <StatCard
              icon={TrendingDown}
              label="Payable"
              value={formatCurrency(stats?.payable ?? 0)}
              hint="We owe suppliers"
              tone="amber"
            />
            <StatCard
              icon={Scale}
              label="Net position"
              value={formatCurrency((stats?.receivable ?? 0) - (stats?.payable ?? 0))}
              hint="Receivable − payable"
              tone="teal"
            />
          </div>

          <Card
            title="Party balances"
            subtitle={`${formatNumber(rows.length)} of ${formatNumber(stats?.parties.length ?? 0)} parties`}
            action={
              <div className="flex flex-wrap items-end gap-2">
                <FilterBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name, code or phone…"
                  className="w-full sm:w-[210px]"
                />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                  aria-label="Filter parties"
                  className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  {TYPE_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              loading={summary.isLoading}
              initialSortKey="balance"
              initialSortDir="desc"
              pageSize={25}
              onRowClick={(row) => setSelected(row)}
              emptyTitle="No parties match these filters"
              emptyHint="Clear the search or filter to see all parties."
              caption="Customer and supplier balances"
            />
            <p className="mt-3 text-[11px] text-muted">
              Click a row to open the full party ledger.
            </p>
          </Card>
        </>
      )}

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Party ledger'}
        subtitle={selected ? `${selected.code} · ${titleCase(selected.partyType)}` : undefined}
        width="wide"
      >
        {selected != null && <LedgerView partyId={selected.id} />}
      </Drawer>
    </div>
  )
}
