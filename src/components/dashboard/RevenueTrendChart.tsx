import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompact, formatCurrency, monthLabel } from '../../lib/format'
import type { TrendPoint } from '../../lib/types'
import ChartFrame from '../ui/ChartFrame'

export default function RevenueTrendChart({ trend }: { trend: TrendPoint[] }) {
  const hasActivity = trend.some((point) => point.revenue !== 0 || point.expenses !== 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--teal)' }} />
          Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--amber)' }} />
          Expenses
        </span>
      </div>
      <ChartFrame height={270}>
        {!hasActivity ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-surface-2/40 px-6 text-center">
            <p className="text-sm font-bold text-ink">No posted revenue or expenses</p>
            <p className="max-w-md text-xs leading-relaxed text-muted">
              The last six months have no posted journal entries. Purchases and stock movements may
              exist without journal postings.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 10, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(value: string) => monthLabel(value)}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompact(value)}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={78}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 12,
              }}
              labelFormatter={(label) => monthLabel(String(label))}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--teal)"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--amber)"
              strokeWidth={2}
              fill="url(#expenseFill)"
            />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
    </div>
  )
}
