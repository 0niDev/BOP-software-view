import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, Download, Package, TriangleAlert, Warehouse } from 'lucide-react'
import { fetchItems } from '../lib/queries/items'
import { formatCurrency, formatDate, formatNumber, formatQuantity, titleCase } from '../lib/format'
import { downloadCsv } from '../lib/download'
import type { ItemRow } from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { ErrorState } from '../components/ui/States'
import FilterBox from '../components/FilterBox'

function isLowStock(row: ItemRow): boolean {
  return row.minimumStock > 0 && row.stock < row.minimumStock
}

export default function ItemsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)

  const items = useQuery({
    queryKey: ['items', includeInactive],
    queryFn: () => fetchItems(includeInactive),
  })

  const allRows = items.data ?? []

  const typeOptions = useMemo(
    () => [...new Set(allRows.map((row) => row.itemType))].sort(),
    [allRows],
  )

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allRows.filter((row) => {
      if (typeFilter && row.itemType !== typeFilter) return false
      if (lowStockOnly && !isLowStock(row)) return false
      if (!needle) return true
      return (
        row.itemName.toLowerCase().includes(needle) ||
        row.itemCode.toLowerCase().includes(needle) ||
        (row.category ?? '').toLowerCase().includes(needle)
      )
    })
  }, [allRows, search, typeFilter, lowStockOnly])

  const activeRows = allRows.filter((row) => row.isActive)
  const totalValue = activeRows.reduce((sum, row) => sum + row.stockValue, 0)
  const lowStockCount = activeRows.filter(isLowStock).length
  const configuredMinimums = activeRows.filter((row) => row.minimumStock > 0).length
  const outOfStockCount = activeRows.filter((row) => row.stock <= 0).length
  const activeCount = activeRows.length

  const columns: Column<ItemRow>[] = [
    {
      key: 'item',
      header: 'Item',
      sortValue: (row) => row.itemName,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-ink" title={row.itemName}>
            {row.itemName}
          </p>
          <p className="text-[10px] text-muted">{row.itemCode}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (row) => row.itemType,
      render: (row) => <span className="text-[11px] font-semibold text-muted">{titleCase(row.itemType)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (row) => row.category ?? '',
      render: (row) => <span className="text-[11px] text-muted">{row.category ?? '—'}</span>,
      hideBelow: 'xl',
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      sortValue: (row) => row.stock,
      render: (row) => (
        <div>
          <p className={`num text-[13px] font-bold ${isLowStock(row) ? 'text-amber-ink' : row.stock <= 0 ? 'text-danger-ink' : 'text-ink'}`}>
            {formatQuantity(row.stock)}
          </p>
          <p className="text-[10px] text-muted">{row.unit.toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'minimum',
      header: 'Minimum',
      align: 'right',
      sortValue: (row) => row.minimumStock,
      render: (row) => (
        <span className="num text-[11px] text-muted">
          {row.minimumStock > 0 ? formatQuantity(row.minimumStock) : '—'}
        </span>
      ),
      hideBelow: '2xl',
    },
    {
      key: 'purchase',
      header: 'Purchase',
      align: 'right',
      sortValue: (row) => row.purchasePrice,
      render: (row) => (
        <span className="num text-[11px] text-muted">
          {row.purchasePrice > 0 ? formatCurrency(row.purchasePrice) : '—'}
        </span>
      ),
      hideBelow: '2xl',
    },
    {
      key: 'sale',
      header: 'Sale',
      align: 'right',
      sortValue: (row) => row.sellingPrice,
      render: (row) => (
        <span className="num text-[11px] text-muted">
          {row.sellingPrice > 0 ? formatCurrency(row.sellingPrice) : '—'}
        </span>
      ),
      hideBelow: '2xl',
    },
    {
      key: 'value',
      header: 'Stock value',
      align: 'right',
      sortValue: (row) => row.stockValue,
      render: (row) => <span className="num text-[12px] font-semibold text-ink">{formatCurrency(row.stockValue)}</span>,
    },
    {
      key: 'expiry',
      header: 'Nearest expiry',
      sortValue: (row) => row.nearestExpiry ?? '',
      render: (row) => <span className="num whitespace-nowrap text-[11px] text-muted">{formatDate(row.nearestExpiry)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <StatusPill value={row.isActive ? 'Active' : 'Inactive'} tone={row.isActive ? 'ok' : 'neutral'} />
      ),
      hideBelow: 'sm',
    },
  ]

  const exportRows = (): void => {
    downloadCsv(
      'items.csv',
      rows.map((row) => ({
        code: row.itemCode,
        name: row.itemName,
        type: row.itemType,
        category: row.category,
        unit: row.unit,
        stock: row.stock,
        minimum: row.minimumStock,
        purchase: row.purchasePrice,
        sale: row.sellingPrice,
        value: row.stockValue,
        expiry: row.nearestExpiry,
        active: row.isActive ? 'Yes' : 'No',
      })),
      [
        { key: 'code', label: 'Item code' },
        { key: 'name', label: 'Item name' },
        { key: 'type', label: 'Type' },
        { key: 'category', label: 'Category' },
        { key: 'unit', label: 'Unit' },
        { key: 'stock', label: 'Stock' },
        { key: 'minimum', label: 'Minimum' },
        { key: 'purchase', label: 'Purchase price' },
        { key: 'sale', label: 'Sale price' },
        { key: 'value', label: 'Stock value' },
        { key: 'expiry', label: 'Nearest expiry' },
        { key: 'active', label: 'Active' },
      ],
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Master data"
        title="Items"
        subtitle="Catalogue, live stock on hand and inventory value"
        actions={
          <button
            type="button"
            onClick={exportRows}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
          >
            <Download size={14} aria-hidden />
            Export CSV
          </button>
        }
      />

      {items.isError ? (
        <ErrorState
          message={items.error instanceof Error ? items.error.message : 'Could not load items.'}
          onRetry={() => items.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              icon={Package}
              label={includeInactive ? 'Items' : 'Active items'}
              value={formatNumber(includeInactive ? allRows.length : activeCount)}
              hint={includeInactive ? `${formatNumber(activeCount)} active` : 'In the catalogue'}
              tone="brand"
            />
            <StatCard
              icon={Boxes}
              label="Inventory value"
              value={formatCurrency(totalValue)}
              hint="Stock on hand × purchase price"
              tone="teal"
            />
            <StatCard
              icon={TriangleAlert}
              label="Low stock"
              value={formatNumber(lowStockCount)}
              hint={configuredMinimums === 0 ? 'No minimum levels configured' : 'Below minimum stock'}
              tone={lowStockCount ? 'amber' : configuredMinimums === 0 ? 'brand' : 'ok'}
            />
            <StatCard
              icon={Warehouse}
              label="No stock"
              value={formatNumber(outOfStockCount)}
              hint="Zero quantity on hand, across all item types"
              tone={outOfStockCount ? 'danger' : 'ok'}
            />
          </div>

          <Card
            title="Item catalogue"
            subtitle={`${formatNumber(rows.length)} of ${formatNumber(allRows.length)} items`}
            action={
              <div className="flex flex-wrap items-end gap-2">
                <FilterBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search item, code or category…"
                  className="w-full sm:w-[220px]"
                />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter by item type"
                  className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">All types</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {titleCase(type)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-pressed={lowStockOnly}
                  onClick={() => setLowStockOnly((value) => !value)}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors ${
                    lowStockOnly
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line bg-surface-2 text-muted hover:text-ink'
                  }`}
                >
                  Low stock
                </button>
                <button
                  type="button"
                  aria-pressed={includeInactive}
                  onClick={() => setIncludeInactive((value) => !value)}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors ${
                    includeInactive
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line bg-surface-2 text-muted hover:text-ink'
                  }`}
                >
                  Include inactive
                </button>
              </div>
            }
          >
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              loading={items.isLoading}
              initialSortKey="value"
              initialSortDir="desc"
              pageSize={50}
              emptyTitle="No items match these filters"
              emptyHint="Clear the search or filters to see the catalogue."
              caption="Item catalogue with stock and value"
            />
          </Card>
        </>
      )}
    </div>
  )
}
