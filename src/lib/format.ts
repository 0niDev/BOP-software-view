/** Shared formatters. PKR, en-PK grouping and dd/MM/yyyy dates. */

const moneyFormat = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const plainFormat = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 2,
})

const quantityFormat = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 3,
})

const compactFormat = new Intl.NumberFormat('en-PK', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** `Rs 1,234.00`, with the sign before the symbol for negatives. */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value < 0 ? '-' : ''
  return `${sign}Rs ${moneyFormat.format(Math.abs(value))}`
}

/** Compact value for KPI tiles: `Rs 1.2M`. */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs < 10_000) return `${sign}Rs ${plainFormat.format(abs)}`
  return `${sign}Rs ${compactFormat.format(abs)}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return plainFormat.format(value)
}

export function formatQuantity(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return quantityFormat.format(value)
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}%`
}

/** Change from `previous` to `current`; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** ISO date (YYYY-MM-DD) in local time, for SQL date() comparisons. */
export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function monthStartISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
}

export function daysBackISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDaysISO(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `2026-10-26` → `26/10/2026`. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const iso = value.slice(0, 10)
  const [year, month, day] = iso.split('-')
  if (iso.length !== 10 || !year || !month || !day) return value
  return `${day}/${month}/${year}`
}

/** `2026-10-26 13:27:56` → `26/10/2026 13:27`. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = formatDate(value)
  return value.length >= 16 ? `${date} ${value.slice(11, 16)}` : date
}

/** `2026-10-01` → `Oct 2026`. */
export function monthLabel(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

/** `2026-10-16` → `16 Oct`. */
export function dayLabel(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

/** Human label for enum-ish database values: FINISHED_GOOD → Finished good. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
