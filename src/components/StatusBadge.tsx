/** Status badge with semantic colors. */
const map: Record<string, string> = {
  PAID: 'bg-success/15 text-success',
  COMPLETED: 'bg-success/15 text-success',
  PARTIAL: 'bg-warning/15 text-warning',
  PENDING: 'bg-warning/15 text-warning',
  UNPAID: 'bg-danger/15 text-danger',
  OVERDUE: 'bg-danger/15 text-danger',
  DRAFT: 'bg-white/10 text-fg-muted',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = map[status.toUpperCase()] ?? 'bg-info/15 text-info'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
