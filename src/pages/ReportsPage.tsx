/** Reports: trial balance, P&L, balance sheet, cash book. Tab + dates deep-linked via ?tab=&from=&to=. */
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { CircleCheck, CircleX } from 'lucide-react'
import { fetchBalanceSheet, fetchCashBook, fetchProfitLoss, fetchTrialBalance } from '../lib/queries/reports'
import { formatCurrency, formatDate, todayISO } from '../lib/format'
import { GlassCard, ErrorState, EmptyState, TableSkeleton } from '../components/ui'

type ReportKey = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'cash-book'

const tabs: { key: ReportKey; label: string }[] = [
  { key: 'trial-balance', label: 'Trial Balance' },
  { key: 'profit-loss', label: 'Profit & Loss' },
  { key: 'balance-sheet', label: 'Balance Sheet' },
  { key: 'cash-book', label: 'Cash Book' },
]

function BalanceFlag({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${ok ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
      {ok ? <CircleCheck aria-hidden="true" className="size-3.5" /> : <CircleX aria-hidden="true" className="size-3.5" />}
      {ok ? okText : badText}
    </span>
  )
}

function TrialBalanceView() {
  const tb = useQuery({ queryKey: ['trial-balance'], queryFn: fetchTrialBalance })

  if (tb.isLoading) return <TableSkeleton rows={8} cols={4} />
  if (tb.isError) {
    return (
      <ErrorState message={tb.error instanceof Error ? tb.error.message : 'Could not load the trial balance.'} onRetry={() => tb.refetch()} />
    )
  }
  const data = tb.data
  if (!data?.rows.length) return <EmptyState message="No posted journal activity yet." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">Closing balances, journal-derived</p>
        <BalanceFlag ok={data.isBalanced} okText="Balanced" badText={`Off by ${formatCurrency(data.balanceDiff)}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="tnums w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Code</th>
              <th scope="col" className="py-2 pr-4 font-medium">Account</th>
              <th scope="col" className="py-2 pr-4 font-medium">Type</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Debit</th>
              <th scope="col" className="py-2 text-right font-medium">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.rows.map((r) => (
              <tr key={r.code} className="text-fg">
                <td className="py-2.5 pr-4 font-medium text-fg-bright">{r.code}</td>
                <td className="max-w-[240px] truncate py-2.5 pr-4" title={r.name}>{r.name}</td>
                <td className="py-2.5 pr-4 text-fg-muted">{r.accountType}</td>
                <td className="py-2.5 pr-4 text-right">{r.closingDebit ? formatCurrency(r.closingDebit) : '—'}</td>
                <td className="py-2.5 text-right">{r.closingCredit ? formatCurrency(r.closingCredit) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-fg-bright">
              <td colSpan={3} className="py-2.5 pr-4 text-sm font-semibold">Totals</td>
              <td className="py-2.5 pr-4 text-right text-sm font-semibold">{formatCurrency(data.totalClosingDebit)}</td>
              <td className="py-2.5 text-right text-sm font-semibold">{formatCurrency(data.totalClosingCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function ProfitLossView({ from, to }: { from: string; to: string }) {
  const pl = useQuery({
    queryKey: ['profit-loss', from, to],
    queryFn: () => fetchProfitLoss(from, to),
  })

  if (pl.isLoading) return <TableSkeleton rows={6} cols={2} />
  if (pl.isError) {
    return (
      <ErrorState message={pl.error instanceof Error ? pl.error.message : 'Could not load the P&L.'} onRetry={() => pl.refetch()} />
    )
  }
  const data = pl.data
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Revenue</p>
          <p className="tnums mt-1 text-lg font-semibold text-success">{formatCurrency(data.totalRevenue)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Expenses</p>
          <p className="tnums mt-1 text-lg font-semibold text-warning">{formatCurrency(data.totalExpenses)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Net Profit</p>
          <p className={`tnums mt-1 text-lg font-semibold ${data.isProfit ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(Math.abs(data.netProfit))}
            <span className="ml-1 text-xs font-normal text-fg-muted">{data.isProfit ? 'profit' : 'loss'}</span>
          </p>
        </div>
      </div>

      {data.revenue.length === 0 && data.expenses.length === 0 ? (
        <EmptyState message="No revenue or expense activity in this period." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[
            { title: 'Revenue', lines: data.revenue, total: data.totalRevenue },
            { title: 'Expenses', lines: data.expenses, total: data.totalExpenses },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{section.title}</h4>
              {section.lines.length === 0 ? (
                <p className="py-3 text-sm text-fg-muted">No {section.title.toLowerCase()} in this period.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {section.lines.map((line) => (
                    <li key={line.code} className="tnums flex items-center justify-between gap-4 py-2 text-sm">
                      <span className="min-w-0 truncate text-fg" title={line.name}>{line.code} · {line.name}</span>
                      <span className="shrink-0 font-medium text-fg-bright">{formatCurrency(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BalanceSheetView() {
  const bs = useQuery({ queryKey: ['balance-sheet'], queryFn: fetchBalanceSheet })

  if (bs.isLoading) return <TableSkeleton rows={6} cols={2} />
  if (bs.isError) {
    return (
      <ErrorState message={bs.error instanceof Error ? bs.error.message : 'Could not load the balance sheet.'} onRetry={() => bs.refetch()} />
    )
  }
  const data = bs.data
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">Assets must equal liabilities plus equity</p>
        <BalanceFlag ok={data.isBalanced} okText="Balanced" badText={`Off by ${formatCurrency(Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity))}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Assets</h4>
          <ul className="divide-y divide-white/5">
            {data.assets.map((line) => (
              <li key={line.code} className="tnums flex items-center justify-between gap-4 py-2 text-sm">
                <span className="min-w-0 truncate text-fg" title={line.name}>{line.code} · {line.name}</span>
                <span className="shrink-0 font-medium text-fg-bright">{formatCurrency(line.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="tnums mt-2 flex justify-between border-t border-white/10 py-2 text-sm font-semibold text-fg-bright">
            <span>Total Assets</span>
            <span>{formatCurrency(data.totalAssets)}</span>
          </p>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Liabilities & Equity</h4>
          <ul className="divide-y divide-white/5">
            {[...data.liabilities, ...data.equity].map((line) => (
              <li key={line.code} className="tnums flex items-center justify-between gap-4 py-2 text-sm">
                <span className="min-w-0 truncate text-fg" title={line.name}>{line.code} · {line.name}</span>
                <span className="shrink-0 font-medium text-fg-bright">{formatCurrency(line.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="tnums mt-2 flex justify-between border-t border-white/10 py-2 text-sm font-semibold text-fg-bright">
            <span>Total Liabilities & Equity</span>
            <span>{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function CashBookView({ from, to }: { from: string; to: string }) {
  const cb = useQuery({
    queryKey: ['cash-book', from, to],
    queryFn: () => fetchCashBook(from, to),
  })

  if (cb.isLoading) return <TableSkeleton rows={6} cols={5} />
  if (cb.isError) {
    return (
      <ErrorState message={cb.error instanceof Error ? cb.error.message : 'Could not load the cash book.'} onRetry={() => cb.refetch()} />
    )
  }
  const data = cb.data
  if (!data || data.entries.length === 0) return <EmptyState message="No cash or bank movement in this period." />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Total In</p>
          <p className="tnums mt-1 text-lg font-semibold text-success">{formatCurrency(data.totalDebit)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Total Out</p>
          <p className="tnums mt-1 text-lg font-semibold text-danger">{formatCurrency(data.totalCredit)}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Net Movement</p>
          <p className={`tnums mt-1 text-lg font-semibold ${data.closingBalance >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(Math.abs(data.closingBalance))}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="tnums w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Date</th>
              <th scope="col" className="py-2 pr-4 font-medium">Voucher</th>
              <th scope="col" className="py-2 pr-4 font-medium">Description</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">In</th>
              <th scope="col" className="py-2 text-right font-medium">Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.entries.map((e, i) => (
              <tr key={`${e.voucherNumber}-${i}`} className="text-fg">
                <td className="py-2.5 pr-4 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="py-2.5 pr-4 font-medium text-fg-bright">{e.voucherNumber}</td>
                <td className="max-w-[220px] truncate py-2.5 pr-4" title={e.description}>{e.description}</td>
                <td className="py-2.5 pr-4 text-right text-success">{e.debit ? formatCurrency(e.debit) : '—'}</td>
                <td className="py-2.5 text-right text-danger">{e.credit ? formatCurrency(e.credit) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab + date range live in the URL so reports are shareable/deep-linkable.
  const active: ReportKey = tabs.some((t) => t.key === searchParams.get('tab'))
    ? (searchParams.get('tab') as ReportKey)
    : 'trial-balance'
  const from = searchParams.get('from') ?? `${new Date().getFullYear()}-01-01`
  const to = searchParams.get('to') ?? todayISO()

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set(key, value)
      return next
    })
  }

  const needsDates = active === 'profit-loss' || active === 'cash-book'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-fg-bright">Reports</h2>
          <p className="text-sm text-fg-muted">Financial statements, journal-derived</p>
        </div>
        <nav aria-label="Reports" className="flex flex-wrap gap-1 rounded-2xl bg-white/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setParam('tab', t.key)}
              aria-pressed={active === t.key}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active === t.key
                  ? 'bg-maroon-800/60 text-fg-bright'
                  : 'text-fg-muted hover:bg-white/5 hover:text-fg-bright'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {needsDates && (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="date-from" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-fg-muted">From</label>
            <input
              id="date-from"
              name="from"
              type="date"
              autoComplete="off"
              value={from}
              onChange={(e) => setParam('from', e.target.value)}
              className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-fg-bright"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-fg-muted">To</label>
            <input
              id="date-to"
              name="to"
              type="date"
              autoComplete="off"
              value={to}
              onChange={(e) => setParam('to', e.target.value)}
              className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-fg-bright"
            />
          </div>
        </div>
      )}

      <GlassCard>
        {active === 'trial-balance' && <TrialBalanceView />}
        {active === 'profit-loss' && <ProfitLossView from={from} to={to} />}
        {active === 'balance-sheet' && <BalanceSheetView />}
        {active === 'cash-book' && <CashBookView from={from} to={to} />}
      </GlassCard>
    </div>
  )
}
