import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, Printer, Scale } from 'lucide-react'
import {
  fetchBalanceSheet,
  fetchCashBook,
  fetchProfitLoss,
  fetchTrialBalance,
} from '../lib/queries/reports'
import { fetchCompany } from '../lib/queries/meta'
import { fetchPartyLedger, fetchPartyOptions } from '../lib/queries/parties'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  titleCase,
  todayISO,
} from '../lib/format'
import { downloadCsv } from '../lib/download'
import type {
  BalanceSheetData,
  CashBookData,
  PartyLedgerData,
  ProfitLossData,
  TrialBalanceData,
} from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatusPill from '../components/ui/StatusPill'
import { Segmented } from '../components/ui/Segmented'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import SearchableSelect from '../components/SearchableSelect'

const TABS = [
  { value: 'trial-balance', label: 'Trial Balance' },
  { value: 'pnl', label: 'Profit & Loss' },
  { value: 'balance-sheet', label: 'Balance Sheet' },
  { value: 'cash-book', label: 'Cash Book' },
  { value: 'party-ledger', label: 'Party Ledger' },
] as const

type Tab = (typeof TABS)[number]['value']

const TAB_VALUES = TABS.map((tab) => tab.value) as Tab[]
const YEAR_START = `${new Date().getFullYear()}-01-01`

function isTab(value: string | null): value is Tab {
  return value != null && (TAB_VALUES as string[]).includes(value)
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
      />
    </label>
  )
}

function ReportTable({
  rows,
  total,
  totalLabel = 'Total',
}: {
  rows: { code: string; name: string; amount: number }[]
  total: number
  totalLabel?: string
}) {
  if (rows.length === 0) {
    return <EmptyState title="No posted amounts in this period" />
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col" className="w-20">Code</th>
            <th scope="col">Account</th>
            <th scope="col" className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.code}-${row.name}`}>
              <td className="num text-[11px] text-muted">{row.code}</td>
              <td className="text-[13px] text-ink">{row.name}</td>
              <td className="num text-right text-[13px] font-semibold text-ink">
                {formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {totalLabel}
            </td>
            <td className="num py-2.5 text-right text-[13px] font-extrabold text-ink">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function TrialBalanceView({ data }: { data: TrialBalanceData }) {
  const columns: Column<TrialBalanceData['rows'][number]>[] = [
    {
      key: 'code',
      header: 'Code',
      sortValue: (row) => row.code,
      render: (row) => <span className="num text-[11px] text-muted">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Account',
      sortValue: (row) => row.name,
      render: (row) => <span className="text-[13px] font-semibold text-ink">{row.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (row) => row.accountType,
      render: (row) => <span className="text-[11px] text-muted">{titleCase(row.accountType)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'openingDebit',
      header: 'Opening Dr',
      align: 'right',
      sortValue: (row) => row.openingDebit,
      render: (row) => <span className="num text-[11px] text-muted">{formatCurrency(row.openingDebit)}</span>,
      hideBelow: 'lg',
    },
    {
      key: 'openingCredit',
      header: 'Opening Cr',
      align: 'right',
      sortValue: (row) => row.openingCredit,
      render: (row) => <span className="num text-[11px] text-muted">{formatCurrency(row.openingCredit)}</span>,
      hideBelow: 'lg',
    },
    {
      key: 'closingDebit',
      header: 'Closing Dr',
      align: 'right',
      sortValue: (row) => row.closingDebit,
      render: (row) => <span className="num text-[12px] text-ink">{formatCurrency(row.closingDebit)}</span>,
    },
    {
      key: 'closingCredit',
      header: 'Closing Cr',
      align: 'right',
      sortValue: (row) => row.closingCredit,
      render: (row) => <span className="num text-[12px] text-ink">{formatCurrency(row.closingCredit)}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={data.isBalanced ? 'ok' : 'danger'}>
          {data.isBalanced ? 'Balanced' : 'Out of balance'}
        </StatusPill>
        {!data.isBalanced && (
          <span className="num text-xs font-semibold text-danger-ink">
            Difference {formatCurrency(data.balanceDiff)}
          </span>
        )}
        <span className="text-[11px] text-muted">
          Opening balances from OPENING vouchers; closing includes all posted journals.
        </span>
      </div>
      <DataTable
        columns={columns}
        rows={data.rows}
        rowKey={(row) => row.code}
        initialSortKey="code"
        initialSortDir="asc"
        emptyTitle="No posted journals"
        caption="Trial balance"
        footer={
          <tr>
            <td colSpan={5} className="py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              Totals
            </td>
            <td className="num py-3 text-right text-[13px] font-extrabold text-ink">
              {formatCurrency(data.totalClosingDebit)}
            </td>
            <td className="num py-3 text-right text-[13px] font-extrabold text-ink">
              {formatCurrency(data.totalClosingCredit)}
            </td>
          </tr>
        }
      />
    </div>
  )
}

function ProfitLossView({ data }: { data: ProfitLossData }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Revenue</p>
          <p className="num mt-1 text-xl font-extrabold text-ok-ink">{formatCurrency(data.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Expenses</p>
          <p className="num mt-1 text-xl font-extrabold text-amber-ink">{formatCurrency(data.totalExpenses)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            {data.isProfit ? 'Net profit' : 'Net loss'}
          </p>
          <p className={`num mt-1 text-xl font-extrabold ${data.isProfit ? 'text-ok-ink' : 'text-danger-ink'}`}>
            {formatCurrency(data.netProfit)}
          </p>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Revenue</h3>
        <ReportTable rows={data.revenue} total={data.totalRevenue} totalLabel="Total revenue" />
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Expenses</h3>
        <ReportTable rows={data.expenses} total={data.totalExpenses} totalLabel="Total expenses" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-4">
        <span className="text-[13px] font-bold text-ink">
          {data.isProfit ? 'Net profit for the period' : 'Net loss for the period'}
        </span>
        <span className={`num text-xl font-extrabold ${data.isProfit ? 'text-ok-ink' : 'text-danger-ink'}`}>
          {formatCurrency(data.netProfit)}
        </span>
      </div>
    </div>
  )
}

function BalanceSheetView({ data }: { data: BalanceSheetData }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-lg border border-line bg-surface-2 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Assets</p>
          <p className="num mt-0.5 text-lg font-extrabold text-ink">{formatCurrency(data.totalAssets)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Liabilities + equity</p>
          <p className="num mt-0.5 text-lg font-extrabold text-ink">
            {formatCurrency(data.totalLiabilitiesAndEquity)}
          </p>
        </div>
        <StatusPill tone={data.isBalanced ? 'ok' : 'danger'}>
          {data.isBalanced ? 'Balanced' : 'Out of balance'}
        </StatusPill>
      </div>

      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Assets</h3>
        <ReportTable rows={data.assets} total={data.totalAssets} totalLabel="Total assets" />
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Liabilities</h3>
        <ReportTable rows={data.liabilities} total={data.totalLiabilities} totalLabel="Total liabilities" />
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Equity</h3>
        <ReportTable rows={data.equity} total={data.totalEquity} totalLabel="Total equity" />
      </section>
    </div>
  )
}

function CashBookView({ data }: { data: CashBookData }) {
  if (data.entries.length === 0) {
    return <EmptyState title="No cash or bank movements in this period" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Receipts</p>
          <p className="num mt-1 text-lg font-extrabold text-ok-ink">{formatCurrency(data.totalDebit)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Payments</p>
          <p className="num mt-1 text-lg font-extrabold text-amber-ink">{formatCurrency(data.totalCredit)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Net movement</p>
          <p className={`num mt-1 text-lg font-extrabold ${data.closingBalance >= 0 ? 'text-ink' : 'text-danger-ink'}`}>
            {formatCurrency(data.closingBalance)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Voucher</th>
              <th scope="col">Description</th>
              <th scope="col" className="hidden md:table-cell">Account</th>
              <th scope="col" className="text-right">Debit</th>
              <th scope="col" className="text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry, index) => (
              <tr key={`${entry.voucherNumber}-${index}`}>
                <td className="num whitespace-nowrap text-muted">{formatDate(entry.date)}</td>
                <td className="text-[11px] font-bold text-ink">{entry.voucherNumber}</td>
                <td className="max-w-[280px]">
                  <p className="truncate text-[12px] text-ink" title={entry.description}>
                    {entry.description}
                  </p>
                </td>
                <td className="hidden text-[11px] text-muted md:table-cell">{entry.accountName}</td>
                <td className="num text-right text-muted">
                  {entry.debit ? formatCurrency(entry.debit) : '—'}
                </td>
                <td className="num text-right text-muted">
                  {entry.credit ? formatCurrency(entry.credit) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Totals
              </td>
              <td className="num py-2.5 text-right text-[13px] font-extrabold text-ink">
                {formatCurrency(data.totalDebit)}
              </td>
              <td className="num py-2.5 text-right text-[13px] font-extrabold text-ink">
                {formatCurrency(data.totalCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function PartyLedgerReport({ data }: { data: PartyLedgerData }) {
  const columns: Column<PartyLedgerData['entries'][number]>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (row) => row.date,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatDate(row.date)}</span>,
    },
    {
      key: 'voucher',
      header: 'Voucher',
      sortValue: (row) => row.voucherNumber,
      render: (row) => (
        <div>
          <p className="text-[11px] font-bold text-ink">{row.voucherNumber}</p>
          <p className="text-[10px] text-muted">{row.voucherType}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortValue: (row) => row.description,
      render: (row) => (
        <div className="max-w-[300px]">
          <p className="truncate text-[12px] text-ink" title={row.description}>
            {row.description}
          </p>
          <p className="text-[10px] text-muted">{row.accountName}</p>
        </div>
      ),
    },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      sortValue: (row) => row.debit,
      render: (row) => <span className="num text-muted">{row.debit ? formatCurrency(row.debit) : '—'}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      sortValue: (row) => row.credit,
      render: (row) => <span className="num text-muted">{row.credit ? formatCurrency(row.credit) : '—'}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'running',
      header: 'Running',
      align: 'right',
      sortValue: (row) => row.running,
      render: (row) => <span className="num font-bold text-ink">{formatCurrency(row.running)}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Opening</p>
          <p className="num mt-1 text-[13px] font-bold text-ink">{formatCurrency(data.openingBalance)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Debit</p>
          <p className="num mt-1 text-[13px] font-bold text-ink">{formatCurrency(data.totalDebit)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Credit</p>
          <p className="num mt-1 text-[13px] font-bold text-ink">{formatCurrency(data.totalCredit)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Closing</p>
          <p className="num mt-1 text-[13px] font-extrabold text-ink">{formatCurrency(data.closingBalance)}</p>
          <p className="text-[10px] text-muted">{data.balanceLabel}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data.entries}
        rowKey={(row) => `${row.voucherNumber}-${row.date}-${row.running}`}
        initialSortKey="date"
        initialSortDir="asc"
        emptyTitle="No ledger entries in this period"
        caption="Party ledger"
        footer={
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
        }
      />
    </div>
  )
}

export default function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab')
  const tab: Tab = isTab(rawTab) ? rawTab : 'trial-balance'

  const [pnlFrom, setPnlFrom] = useState(YEAR_START)
  const [pnlTo, setPnlTo] = useState(todayISO())
  const [asOf, setAsOf] = useState(todayISO())
  const [cashFrom, setCashFrom] = useState(YEAR_START)
  const [cashTo, setCashTo] = useState(todayISO())
  const [partyId, setPartyId] = useState<number | string | null>(null)
  const [ledgerFrom, setLedgerFrom] = useState('')
  const [ledgerTo, setLedgerTo] = useState('')

  const company = useQuery({ queryKey: ['company'], queryFn: fetchCompany, staleTime: 10 * 60_000 })
  const partyOptions = useQuery({
    queryKey: ['party-options'],
    queryFn: fetchPartyOptions,
    staleTime: 10 * 60_000,
    enabled: tab === 'party-ledger',
  })

  const trial = useQuery({
    queryKey: ['report-trial'],
    queryFn: fetchTrialBalance,
    enabled: tab === 'trial-balance',
  })
  const pnl = useQuery({
    queryKey: ['report-pnl', pnlFrom, pnlTo],
    queryFn: () => fetchProfitLoss(pnlFrom, pnlTo),
    enabled: tab === 'pnl',
  })
  const sheet = useQuery({
    queryKey: ['report-balance-sheet', asOf],
    queryFn: () => fetchBalanceSheet(asOf),
    enabled: tab === 'balance-sheet',
  })
  const cash = useQuery({
    queryKey: ['report-cash-book', cashFrom, cashTo],
    queryFn: () => fetchCashBook(cashFrom, cashTo),
    enabled: tab === 'cash-book',
  })
  const ledger = useQuery({
    queryKey: ['report-party-ledger', partyId, ledgerFrom, ledgerTo],
    queryFn: () => fetchPartyLedger(partyId as number, ledgerFrom || undefined, ledgerTo || undefined),
    enabled: tab === 'party-ledger' && partyId != null,
  })

  const setTab = (value: Tab): void => {
    const next = new URLSearchParams(params)
    next.set('tab', value)
    setParams(next, { replace: true })
  }

  const exportActive = (): void => {
    if (tab === 'trial-balance' && trial.data) {
      downloadCsv(
        'trial-balance.csv',
        trial.data.rows.map((row) => ({
          code: row.code,
          account: row.name,
          type: row.accountType,
          openingDebit: row.openingDebit,
          openingCredit: row.openingCredit,
          closingDebit: row.closingDebit,
          closingCredit: row.closingCredit,
        })),
        [
          { key: 'code', label: 'Code' },
          { key: 'account', label: 'Account' },
          { key: 'type', label: 'Type' },
          { key: 'openingDebit', label: 'Opening debit' },
          { key: 'openingCredit', label: 'Opening credit' },
          { key: 'closingDebit', label: 'Closing debit' },
          { key: 'closingCredit', label: 'Closing credit' },
        ],
      )
    } else if (tab === 'pnl' && pnl.data) {
      downloadCsv(
        'profit-and-loss.csv',
        [
          ...pnl.data.revenue.map((row) => ({ section: 'Revenue', ...row })),
          ...pnl.data.expenses.map((row) => ({ section: 'Expense', ...row })),
        ],
        [
          { key: 'section', label: 'Section' },
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Account' },
          { key: 'amount', label: 'Amount' },
        ],
      )
    } else if (tab === 'balance-sheet' && sheet.data) {
      downloadCsv(
        'balance-sheet.csv',
        [
          ...sheet.data.assets.map((row) => ({ section: 'Asset', ...row })),
          ...sheet.data.liabilities.map((row) => ({ section: 'Liability', ...row })),
          ...sheet.data.equity.map((row) => ({ section: 'Equity', ...row })),
        ],
        [
          { key: 'section', label: 'Section' },
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Account' },
          { key: 'amount', label: 'Amount' },
        ],
      )
    } else if (tab === 'cash-book' && cash.data) {
      downloadCsv(
        'cash-book.csv',
        cash.data.entries.map((entry) => ({
          date: entry.date,
          voucher: entry.voucherNumber,
          description: entry.description,
          account: entry.accountName,
          debit: entry.debit,
          credit: entry.credit,
        })),
        [
          { key: 'date', label: 'Date' },
          { key: 'voucher', label: 'Voucher' },
          { key: 'description', label: 'Description' },
          { key: 'account', label: 'Account' },
          { key: 'debit', label: 'Debit' },
          { key: 'credit', label: 'Credit' },
        ],
      )
    } else if (tab === 'party-ledger' && ledger.data) {
      downloadCsv(
        'party-ledger.csv',
        ledger.data.entries.map((entry) => ({
          date: entry.date,
          voucher: entry.voucherNumber,
          type: entry.voucherType,
          description: entry.description,
          debit: entry.debit,
          credit: entry.credit,
          running: entry.running,
        })),
        [
          { key: 'date', label: 'Date' },
          { key: 'voucher', label: 'Voucher' },
          { key: 'type', label: 'Type' },
          { key: 'description', label: 'Description' },
          { key: 'debit', label: 'Debit' },
          { key: 'credit', label: 'Credit' },
          { key: 'running', label: 'Running balance' },
        ],
      )
    }
  }

  const reportTitle = TABS.find((item) => item.value === tab)?.label ?? 'Report'
  const printRange =
    tab === 'trial-balance'
      ? 'All posted entries'
      : tab === 'pnl'
        ? `${formatDate(pnlFrom)} – ${formatDate(pnlTo)}`
        : tab === 'balance-sheet'
          ? `As of ${formatDate(asOf)}`
          : tab === 'cash-book'
            ? `${formatDate(cashFrom)} – ${formatDate(cashTo)}`
            : ledgerFrom || ledgerTo
              ? `${ledgerFrom ? formatDate(ledgerFrom) : 'Start'} – ${ledgerTo ? formatDate(ledgerTo) : 'Today'}`
              : 'All dates'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Trial balance, profitability, financial position, cash flow and party ledgers"
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportActive}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-line-strong"
            >
              <Download size={14} aria-hidden />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-line-strong"
            >
              <Printer size={14} aria-hidden />
              Print
            </button>
          </div>
        }
      />

      <div className="no-print">
        <Segmented options={TABS.map((item) => ({ value: item.value, label: item.label }))} value={tab} onChange={setTab} label="Report type" />
      </div>

      <div className="print-area flex flex-col gap-5">
        <div className="hidden print:block">
          <p className="text-sm font-bold">{company.data?.name ?? 'BOP Nutraceuticals'}</p>
          <p className="text-lg font-extrabold">{reportTitle}</p>
          <p className="text-xs text-muted">{printRange}</p>
        </div>

        <Card
          title={reportTitle}
          subtitle={printRange}
          action={
            <span className="no-print inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
              <Scale size={13} aria-hidden />
              {tab === 'trial-balance' ? `${formatNumber(trial.data?.rows.length ?? 0)} accounts` : 'PKR'}
            </span>
          }
        >
          {tab === 'trial-balance' && (
            <>
              <div className="no-print mb-4 text-[11px] text-muted">
                Journal-derived, all posted entries. No date filter is applied to the trial balance.
              </div>
              {trial.isLoading ? (
                <Skeleton className="h-72 rounded-lg" />
              ) : trial.isError ? (
                <ErrorState
                  message={trial.error instanceof Error ? trial.error.message : 'Could not load the trial balance.'}
                  onRetry={() => trial.refetch()}
                />
              ) : trial.data ? (
                <TrialBalanceView data={trial.data} />
              ) : null}
            </>
          )}

          {tab === 'pnl' && (
            <>
              <div className="no-print mb-4 flex flex-wrap items-end gap-2">
                <DateField label="From" value={pnlFrom} onChange={setPnlFrom} />
                <DateField label="To" value={pnlTo} onChange={setPnlTo} />
                <button
                  type="button"
                  onClick={() => {
                    setPnlFrom(`${new Date().getFullYear()}-01-01`)
                    setPnlTo(todayISO())
                  }}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-xs font-bold text-muted transition-colors hover:text-ink"
                >
                  This year
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPnlFrom(`${todayISO().slice(0, 7)}-01`)
                    setPnlTo(todayISO())
                  }}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-xs font-bold text-muted transition-colors hover:text-ink"
                >
                  This month
                </button>
              </div>
              {pnl.isLoading ? (
                <Skeleton className="h-72 rounded-lg" />
              ) : pnl.isError ? (
                <ErrorState
                  message={pnl.error instanceof Error ? pnl.error.message : 'Could not load profit and loss.'}
                  onRetry={() => pnl.refetch()}
                />
              ) : pnl.data ? (
                <ProfitLossView data={pnl.data} />
              ) : null}
            </>
          )}

          {tab === 'balance-sheet' && (
            <>
              <div className="no-print mb-4 flex flex-wrap items-end gap-2">
                <DateField label="As of" value={asOf} onChange={setAsOf} />
              </div>
              {sheet.isLoading ? (
                <Skeleton className="h-72 rounded-lg" />
              ) : sheet.isError ? (
                <ErrorState
                  message={sheet.error instanceof Error ? sheet.error.message : 'Could not load the balance sheet.'}
                  onRetry={() => sheet.refetch()}
                />
              ) : sheet.data ? (
                <BalanceSheetView data={sheet.data} />
              ) : null}
            </>
          )}

          {tab === 'cash-book' && (
            <>
              <div className="no-print mb-4 flex flex-wrap items-end gap-2">
                <DateField label="From" value={cashFrom} onChange={setCashFrom} />
                <DateField label="To" value={cashTo} onChange={setCashTo} />
                <button
                  type="button"
                  onClick={() => {
                    setCashFrom(YEAR_START)
                    setCashTo(todayISO())
                  }}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-xs font-bold text-muted transition-colors hover:text-ink"
                >
                  This year
                </button>
              </div>
              {cash.isLoading ? (
                <Skeleton className="h-72 rounded-lg" />
              ) : cash.isError ? (
                <ErrorState
                  message={cash.error instanceof Error ? cash.error.message : 'Could not load the cash book.'}
                  onRetry={() => cash.refetch()}
                />
              ) : cash.data ? (
                <CashBookView data={cash.data} />
              ) : null}
            </>
          )}

          {tab === 'party-ledger' && (
            <>
              <div className="no-print mb-4 flex flex-wrap items-end gap-2">
                <SearchableSelect
                  label="Party"
                  options={(partyOptions.data ?? []).map((party) => ({
                    id: party.id,
                    label: party.name,
                    hint: `${party.code} · ${titleCase(party.partyType)}`,
                  }))}
                  value={partyId}
                  onChange={(value) => setPartyId(value)}
                  placeholder="Search a customer or supplier…"
                  className="w-[280px]"
                />
                <DateField label="From" value={ledgerFrom} onChange={setLedgerFrom} />
                <DateField label="To" value={ledgerTo} onChange={setLedgerTo} />
                {partyId != null && (
                  <button
                    type="button"
                    onClick={() => {
                      setPartyId(null)
                      setLedgerFrom('')
                      setLedgerTo('')
                    }}
                    className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-xs font-bold text-muted transition-colors hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
              {partyId == null ? (
                <EmptyState
                  title="Choose a party"
                  hint="Search for a customer or supplier to see its running ledger, opening balance and closing position."
                />
              ) : ledger.isLoading ? (
                <Skeleton className="h-72 rounded-lg" />
              ) : ledger.isError ? (
                <ErrorState
                  message={ledger.error instanceof Error ? ledger.error.message : 'Could not load the ledger.'}
                  onRetry={() => ledger.refetch()}
                />
              ) : ledger.data ? (
                <PartyLedgerReport data={ledger.data} />
              ) : null}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
