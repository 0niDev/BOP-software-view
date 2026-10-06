/** Dashboard: KPI grid, sales-vs-purchases chart, recent transactions. */
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Landmark,
  Boxes,
  Users,
  Receipt,
  BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { fetchDashboard, fetchSalesTrend } from '../lib/queries/dashboard'
import { formatCurrency, formatCompact, formatDate, formatNumber } from '../lib/format'
import { StatCard } from '../components/StatCard'
import { GlassCard, ErrorState, TableSkeleton } from '../components/ui'

const axisStyle = { fill: '#8B93A7', fontSize: 11 }
const tooltipStyle = {
  backgroundColor: '#1E222D',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#C5CEE0',
}

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })
  const trend = useQuery({ queryKey: ['sales-trend'], queryFn: () => fetchSalesTrend(14) })

  if (dashboard.isError) {
    return (
      <ErrorState
        message={
          dashboard.error instanceof Error
            ? dashboard.error.message
            : 'Could not load dashboard data.'
        }
        onRetry={() => dashboard.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-fg-bright">Dashboard</h2>
        <p className="text-sm text-fg-muted">Today at a glance</p>
      </header>

      {dashboard.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-[104px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} icon={TrendingUp} label="Today's Sales" value={formatCurrency(dashboard.data?.todaySales.total)} sub={`${formatNumber(dashboard.data?.todaySales.count)} transactions`} accent="success" />
          <StatCard index={1} icon={ShoppingCart} label="Today's Purchases" value={formatCurrency(dashboard.data?.todayPurchases.total)} sub={`${formatNumber(dashboard.data?.todayPurchases.count)} transactions`} accent="warning" />
          <StatCard index={2} icon={Wallet} label="Cash" value={formatCurrency(dashboard.data?.cash)} accent="maroon" />
          <StatCard index={3} icon={Landmark} label="Bank" value={formatCurrency(dashboard.data?.bank)} accent="info" />
          <StatCard index={4} icon={Boxes} label="Inventory Value" value={formatCurrency(dashboard.data?.inventoryValue)} sub={`${formatNumber(dashboard.data?.totalItems)} items`} accent="info" />
          <StatCard index={5} icon={BarChart3} label="Total Revenue" value={formatCurrency(dashboard.data?.revenue)} accent="success" />
          <StatCard index={6} icon={Users} label="Parties" value={formatNumber(dashboard.data?.totalParties)} accent="maroon" />
          <StatCard index={7} icon={Receipt} label="Total Assets (Cash + Bank + Inventory)" value={formatCurrency((dashboard.data?.cash ?? 0) + (dashboard.data?.bank ?? 0) + (dashboard.data?.inventoryValue ?? 0))} accent="success" />
        </div>
      )}

      <GlassCard>
        <h3 className="mb-4 text-sm font-semibold text-fg-bright">Sales vs Purchases — Last 14 Days</h3>
        {trend.isLoading ? (
          <div className="skeleton h-64 rounded-xl" aria-hidden="true" />
        ) : trend.isError ? (
          <p role="alert" className="text-sm text-danger">Could not load the sales trend chart.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data ?? []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C70039" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C70039" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v: string) => formatDate(v)} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={70} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ color: '#8B93A7' }} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#10B981" fill="url(#salesFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#C70039" fill="url(#purchaseFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 text-sm font-semibold text-fg-bright">Recent Transactions</h3>
        {dashboard.isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : !dashboard.data?.recent.length ? (
          <p className="py-6 text-center text-sm text-fg-muted">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tnums w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Reference</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Date</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Type</th>
                  <th scope="col" className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboard.data.recent.map((t) => (
                  <tr key={`${t.type}-${t.reference}`} className="text-fg">
                    <td className="py-2.5 pr-4 font-medium text-fg-bright">{t.reference}</td>
                    <td className="py-2.5 pr-4">{formatDate(t.date)}</td>
                    <td className="py-2.5 pr-4">{t.type}</td>
                    <td className={`py-2.5 text-right font-medium ${t.type === 'Sales' ? 'text-success' : 'text-warning'}`}>
                      {formatCurrency(t.amount)}
                    </td>
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
