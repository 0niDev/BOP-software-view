import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Banknote,
  Coins,
  FileBarChart,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { fetchDashboard } from '../lib/queries/dashboard'
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  percentChange,
  todayISO,
} from '../lib/format'
import Card from '../components/ui/Card'
import DeltaPill from '../components/ui/DeltaPill'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { ErrorState, KpiSkeletons, Skeleton } from '../components/ui/States'
import RevenueTrendChart from '../components/dashboard/RevenueTrendChart'
import ActivityList from '../components/dashboard/ActivityList'
import BestSellersTable from '../components/dashboard/BestSellersTable'
import LowStockTable from '../components/dashboard/LowStockTable'
import ExpiringTable from '../components/dashboard/ExpiringTable'
import LiquidityCard from '../components/dashboard/LiquidityCard'

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })

  if (dashboard.isError) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader eyebrow="Overview" title="Business at a glance" />
        <ErrorState
          message={
            dashboard.error instanceof Error
              ? dashboard.error.message
              : 'Could not load the dashboard.'
          }
          onRetry={() => dashboard.refetch()}
        />
      </div>
    )
  }

  if (dashboard.isLoading || !dashboard.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader eyebrow="Overview" title="Business at a glance" subtitle="Loading the latest figures…" />
        <KpiSkeletons count={4} />
        <KpiSkeletons count={4} />
        <Skeleton className="h-[340px] rounded-card" />
      </div>
    )
  }

  const data = dashboard.data
  const trend = data.monthlyTrend
  const latest = trend.at(-1)
  const previous = trend.at(-2)
  const revenueChange = latest && previous ? percentChange(latest.revenue, previous.revenue) : null
  const expenseChange = latest && previous ? percentChange(latest.expenses, previous.expenses) : null
  const margin = data.profitLoss.revenue
    ? (data.profitLoss.profit / data.profitLoss.revenue) * 100
    : null
  const liquidity = data.balances.cash + data.balances.bank
  const amountHint = (value: number, fallback: string): string =>
    Math.abs(value) >= 10_000 ? formatCurrency(value) : fallback
  const activeAlerts = data.alerts.filter((alert) => alert.type !== 'success')

  const todayLine = `${formatNumber(data.today.salesCount)} sale${
    data.today.salesCount === 1 ? '' : 's'
  } (${formatCurrency(data.today.salesTotal)}) and ${formatNumber(data.today.purchasesCount)} purchase${
    data.today.purchasesCount === 1 ? '' : 's'
  } (${formatCurrency(data.today.purchasesTotal)}) today`

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Overview"
        title="Business at a glance"
        subtitle={todayLine}
        actions={
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-strong"
          >
            <FileBarChart size={15} aria-hidden />
            Open reports
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Revenue this month"
          value={formatCompact(data.profitLoss.revenue)}
          hint={amountHint(data.profitLoss.revenue, 'No posted revenue this month')}
          badge={revenueChange == null ? undefined : <DeltaPill change={revenueChange} label="MoM" />}
          tone="ok"
          delay={0}
        />
        <StatCard
          icon={TrendingDown}
          label="Expenses this month"
          value={formatCompact(data.profitLoss.expenses)}
          hint={amountHint(data.profitLoss.expenses, 'No posted expenses this month')}
          badge={expenseChange == null ? undefined : <DeltaPill change={expenseChange} label="MoM" invert />}
          tone="amber"
          delay={0.03}
        />
        <StatCard
          icon={Coins}
          label={data.profitLoss.isProfit ? 'Net profit' : 'Net loss'}
          value={formatCompact(data.profitLoss.profit)}
          hint={amountHint(data.profitLoss.profit, 'Revenue minus expenses')}
          badge={
            margin == null ? undefined : (
              <StatusPill tone={data.profitLoss.isProfit ? 'ok' : 'danger'}>
                {`${formatPercent(margin)} margin`}
              </StatusPill>
            )
          }
          tone={data.profitLoss.isProfit ? 'ok' : 'danger'}
          delay={0.06}
        />
        <StatCard
          icon={Banknote}
          label="Cash & bank"
          value={formatCompact(liquidity)}
          hint={`Cash ${formatCurrency(data.balances.cash)} · Bank ${formatCurrency(data.balances.bank)}`}
          tone="teal"
          delay={0.09}
        />
      </div>

      <Card
        title="Today"
        subtitle={formatDate(todayISO())}
        bodyClassName="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Sales today</p>
          <p className="num mt-1 text-lg font-extrabold text-ok-ink">
            {formatCurrency(data.today.salesTotal)}
          </p>
          <p className="text-[11px] text-muted">{formatNumber(data.today.salesCount)} invoice(s)</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Purchases today</p>
          <p className="num mt-1 text-lg font-extrabold text-amber-ink">
            {formatCurrency(data.today.purchasesTotal)}
          </p>
          <p className="text-[11px] text-muted">{formatNumber(data.today.purchasesCount)} invoice(s)</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Receivable</p>
          <p className="num mt-1 text-lg font-extrabold text-ink">
            {formatCurrency(data.balances.receivable)}
          </p>
          <p className="text-[11px] text-muted">Customers owe us</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Payable</p>
          <p className="num mt-1 text-lg font-extrabold text-ink">
            {formatCurrency(data.balances.payable)}
          </p>
          <p className="text-[11px] text-muted">We owe suppliers</p>
        </div>
      </Card>

      <Card title="Revenue vs expenses" subtitle="Last six months, journal-derived">
        <RevenueTrendChart trend={trend} />
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card
          title="Recent activity"
          subtitle="Newest invoices, payments, receipts and expenses"
          bodyClassName="pt-1"
        >
          <ActivityList rows={data.recentTransactions} />
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Liquidity" subtitle="Cash, bank and inventory" bodyClassName="pt-1">
            <LiquidityCard balances={data.balances} />
          </Card>

          <Card
            title="Alerts"
            subtitle={activeAlerts.length ? `${activeAlerts.length} item(s) need attention` : 'Nothing needs attention'}
            bodyClassName="pt-1"
          >
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col gap-2 py-4 text-center">
                <p className="text-xs font-semibold text-ok-ink">All clear</p>
                <p className="text-[11px] text-muted">
                  No low-stock or expiry alerts right now.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {activeAlerts.slice(0, 6).map((alert, index) => (
                  <li key={`${alert.title}-${index}`} className="flex gap-2 py-2.5">
                    <span
                      aria-hidden
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: alert.type === 'danger' ? 'var(--danger)' : 'var(--amber)',
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">{alert.title}</p>
                      <p className="text-[11px] leading-snug text-muted">{alert.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/items"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-brand hover:text-brand-strong"
            >
              Review inventory
              <ArrowUpRight size={12} aria-hidden />
            </Link>
          </Card>
        </div>
      </div>

      <Card
        title="Best sellers"
        subtitle="Ranked by revenue across all sales"
        action={
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
            <Receipt size={13} aria-hidden />
            {formatNumber(data.topItems.length)} items
          </span>
        }
      >
        <BestSellersTable rows={data.topItems} />
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Low stock"
          subtitle={`${formatNumber(data.inventory.lowStockCount)} of ${formatNumber(
            data.inventory.totalItems,
          )} active items`}
          action={
            <StatusPill
              tone={
                data.inventory.lowStockCount
                  ? 'warn'
                  : data.inventory.minimumConfigured === 0
                    ? 'neutral'
                    : 'ok'
              }
            >
              {data.inventory.lowStockCount
                ? 'Review'
                : data.inventory.minimumConfigured === 0
                  ? 'Not set'
                  : 'OK'}
            </StatusPill>
          }
        >
          <LowStockTable
            rows={data.inventory.lowStockItems}
            totalItems={data.inventory.totalItems}
            minimumConfigured={data.inventory.minimumConfigured}
          />
        </Card>
        <Card
          title="Expiring soon"
          subtitle="Stock on hand, next 30 days"
          action={
            <StatusPill tone={data.inventory.expiringCount ? 'danger' : 'ok'}>
              {data.inventory.expiringCount ? `${data.inventory.expiringCount} batch(es)` : 'OK'}
            </StatusPill>
          }
        >
          <ExpiringTable rows={data.inventory.expiringItems} />
        </Card>
      </div>

      <Card title="Where the money comes from" subtitle="Top customers by revenue">
        {data.salesByCustomer.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">
            Customer revenue appears once sales invoices are posted.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {data.salesByCustomer.map((customer) => (
              <li key={customer.partyName} className="flex items-center justify-between gap-3 py-2.5">
                <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-semibold text-ink">
                  <ShoppingCart size={14} className="shrink-0 text-muted" aria-hidden />
                  <span className="truncate">{customer.partyName}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="num block text-[13px] font-bold text-ink">
                    {formatCurrency(customer.revenue)}
                  </span>
                  <span className="text-[10px] text-muted">{formatNumber(customer.invoices)} invoice(s)</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
