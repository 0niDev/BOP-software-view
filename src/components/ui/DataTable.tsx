import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import { EmptyState } from './States'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  /** Enables sorting when provided. */
  sortValue?: (row: T) => string | number | null | undefined
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
  /** Hide the column below a breakpoint to keep narrow screens readable. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  loadingRows?: number
  emptyTitle?: string
  emptyHint?: string
  initialSortKey?: string
  initialSortDir?: 'asc' | 'desc'
  pageSize?: number
  onRowClick?: (row: T) => void
  footer?: ReactNode
  caption?: string
}

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
  '2xl': 'hidden 2xl:table-cell',
}

const ALIGN: Record<NonNullable<Column<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

/**
 * Shared sortable table. Sorting and pagination are local; the caller owns
 * search/filters and passes the visible rows in.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  loadingRows = 6,
  emptyTitle = 'Nothing to show yet',
  emptyHint,
  initialSortKey,
  initialSortDir = 'asc',
  pageSize,
  onRowClick,
  footer,
  caption,
}: Props<T>) {
  const [sort, setSort] = useState<SortState | null>(
    initialSortKey ? { key: initialSortKey, dir: initialSortDir } : null,
  )
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((candidate) => candidate.key === sort.key)
    if (!column?.sortValue) return rows
    const getValue = column.sortValue
    const direction = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((left, right) => {
      const a = getValue(left)
      const b = getValue(right)
      if (a == null && b == null) return 0
      if (a == null) return 1
      if (b == null) return -1
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * direction
    })
  }, [rows, sort, columns])

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const safePage = Math.min(page, pageCount)
  const visible = pageSize
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted

  useEffect(() => {
    setPage(1)
  }, [rows.length, sort])

  const toggleSort = (column: Column<T>): void => {
    if (!column.sortValue) return
    setSort((current) => {
      if (current?.key !== column.key) return { key: column.key, dir: 'asc' }
      if (current.dir === 'asc') return { key: column.key, dir: 'desc' }
      return null
    })
  }

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="data-table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key
                const align = ALIGN[column.align ?? 'left']
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`${align} ${column.hideBelow ? HIDE[column.hideBelow] : ''} ${column.headerClassName ?? ''}`}
                    aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        className="sort-btn"
                        data-active={active}
                        onClick={() => toggleSort(column)}
                      >
                        {column.header}
                        {!active ? (
                          <ArrowUpDown size={11} aria-hidden />
                        ) : sort?.dir === 'asc' ? (
                          <ChevronUp size={11} aria-hidden />
                        ) : (
                          <ChevronDown size={11} aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: loadingRows }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.hideBelow ? HIDE[column.hideBelow] : ''}
                    >
                      <div className="skeleton h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} hint={emptyHint} />
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  data-clickable={onRowClick ? 'true' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`${ALIGN[column.align ?? 'left']} ${
                        column.hideBelow ? HIDE[column.hideBelow] : ''
                      } ${column.className ?? ''}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer && visible.length > 0 && <tfoot>{footer}</tfoot>}
        </table>
      </div>

      {pageSize && sorted.length > pageSize && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span className="num">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-semibold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
            >
              Previous
            </button>
            <span className="num px-1">
              {safePage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              disabled={safePage >= pageCount}
              className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-semibold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
