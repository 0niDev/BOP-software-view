/** Parties: AR/AP summary + party ledger viewer. */
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { fetchPartyLedger, fetchPartyOptions, fetchPartiesSummary } from '../lib/queries/parties'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'
import { GlassCard, ErrorState, EmptyState, TableSkeleton } from '../components/ui'
import { StatCard } from '../components/StatCard'
import { Users, HandCoins } from 'lucide-react'

function LedgerView({ partyId }: { partyId: number }) {
  const ledger = useQuery({
    queryKey: ['party-ledger', partyId],
    queryFn: () => fetchPartyLedger(partyId),
  })

  if (ledger.isLoading) return <TableSkeleton rows={6} cols={6} />
  if (ledger.isError) {
    return (
      <ErrorState
        message={ledger.error instanceof Error ? ledger.error.message : 'Could not load the ledger.'}
        onRetry={() => ledger.refetch()}
      />
    )
  }
  const data = ledger.data
  if (!data || data.entries.length === 0) {
    return <EmptyState message="No posted entries for this party yet." />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg-bright">
            {data.party.code} — {data.party.name}
          </p>
          <p className="text-xs text-fg-muted">{data.party.partyType}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Closing Balance</p>
          <p className={`tnums text-lg font-semibold ${data.closingBalance >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(Math.abs(data.closingBalance))}
          </p>
          <p className="text-xs text-fg-muted">{data.balanceLabel}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="tnums w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Date</th>
              <th scope="col" className="py-2 pr-4 font-medium">Voucher</th>
              <th scope="col" className="py-2 pr-4 font-medium">Description</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Debit</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Credit</th>
              <th scope="col" className="py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.entries.map((e, i) => (
              <tr key={`${e.voucherNumber}-${i}`} className="text-fg">
                <td className="py-2.5 pr-4 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="py-2.5 pr-4 font-medium text-fg-bright">{e.voucherNumber}</td>
                <td className="max-w-[220px] truncate py-2.5 pr-4" title={e.description}>{e.description}</td>
                <td className="py-2.5 pr-4 text-right text-fg">{e.debit ? formatCurrency(e.debit) : '—'}</td>
                <td className="py-2.5 pr-4 text-right text-fg">{e.credit ? formatCurrency(e.credit) : '—'}</td>
                <td className={`py-2.5 text-right font-medium ${e.running >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(Math.abs(e.running))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-fg-bright">
              <td colSpan={3} className="py-2.5 pr-4 text-sm font-semibold">Totals</td>
              <td className="py-2.5 pr-4 text-right text-sm font-semibold">{formatCurrency(data.totalDebit)}</td>
              <td className="py-2.5 pr-4 text-right text-sm font-semibold">{formatCurrency(data.totalCredit)}</td>
              <td className="py-2.5 text-right text-sm font-semibold">{formatCurrency(Math.abs(data.closingBalance))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function PartiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('party')

  const summary = useQuery({ queryKey: ['parties-summary'], queryFn: fetchPartiesSummary })
  const options = useQuery({ queryKey: ['party-options'], queryFn: fetchPartyOptions })

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-fg-bright">Parties</h2>
        <p className="text-sm text-fg-muted">Receivables, payables and ledgers</p>
      </header>

      {summary.isError ? (
        <ErrorState
          message={summary.error instanceof Error ? summary.error.message : 'Could not load parties.'}
          onRetry={() => summary.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard icon={ArrowLeft} label="Total Receivable" value={summary.isLoading ? 'Loading…' : formatCurrency(summary.data?.receivable)} sub={`${formatNumber(summary.data?.parties.filter((p) => p.balance > 0).length)} parties with a positive balance`} accent="success" />
          <StatCard icon={ArrowRight} label="Total Payable" value={summary.isLoading ? 'Loading…' : formatCurrency(summary.data?.payable)} sub={`${formatNumber(summary.data?.parties.filter((p) => p.balance < 0).length)} parties with a negative balance`} accent="danger" />
        </div>
      )}

      <GlassCard>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="min-w-0">
            <label htmlFor="party-select" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Party
            </label>
            <select
              id="party-select"
              name="party"
              value={selectedId ?? ''}
              onChange={(e) => {
                const value = e.target.value
                if (value) setSearchParams({ party: value })
                else setSearchParams({})
              }}
              className="w-64 max-w-full rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-fg-bright"
            >
              <option value="">Select a party…</option>
              {(options.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedId && Number.isFinite(Number(selectedId)) ? (
          <LedgerView partyId={Number(selectedId)} />
        ) : (
          <EmptyState message="Select a party to view its ledger." />
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg-bright">
          <Users aria-hidden="true" className="size-4" /> Party Balances
        </h3>
        {summary.isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : summary.isError ? null : !summary.data?.parties.length ? (
          <EmptyState message="No party balances yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tnums w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Code</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Type</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Debit</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Credit</th>
                  <th scope="col" className="py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.data.parties.map((p) => (
                  <tr key={p.code} className="text-fg">
                    <td className="py-2.5 pr-4">
                      <Link
                        to={`/parties?party=${p.id ?? ''}`}
                        className="font-medium text-maroon-500 hover:text-maroon-600"
                      >
                        {p.code}
                      </Link>
                    </td>
                    <td className="max-w-[220px] truncate py-2.5 pr-4 text-fg-bright" title={p.name}>{p.name}</td>
                    <td className="py-2.5 pr-4">{p.partyType}</td>
                    <td className="py-2.5 pr-4 text-right">{formatCurrency(p.debit)}</td>
                    <td className="py-2.5 pr-4 text-right">{formatCurrency(p.credit)}</td>
                    <td className={`py-2.5 text-right font-medium ${p.balance > 0 ? 'text-success' : p.balance < 0 ? 'text-danger' : 'text-fg-muted'}`}>
                      {formatCurrency(Math.abs(p.balance))}
                      <span className="sr-only"> {p.kind}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <p className="flex items-center gap-2 text-xs text-fg-muted">
        <HandCoins aria-hidden="true" className="size-3.5" /> Balances are journal-derived; customers are receivable when debit &gt; credit.
      </p>
    </div>
  )
}
