import type { ReactNode } from 'react'

/** Fixed-height container required by a Recharts ResponsiveContainer. */
export default function ChartFrame({
  height = 260,
  children,
}: {
  height?: number
  children: ReactNode
}) {
  return (
    <div className="w-full min-w-0" style={{ height }}>
      {children}
    </div>
  )
}
