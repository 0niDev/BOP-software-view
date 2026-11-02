import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, Download, Factory, FlaskConical, PackageCheck } from 'lucide-react'
import { fetchManufacturing } from '../lib/queries/manufacturing'
import {
  formatCurrency,
  formatCompact,
  formatDate,
  formatDateTime,
  formatNumber,
  titleCase,
} from '../lib/format'
import { downloadCsv } from '../lib/download'
import type {
  BomComponentRow,
  BomRow,
  ManufacturingConsumptionRow,
  PackingOrderRow,
  ProductionOrderRow,
} from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import Drawer from '../components/ui/Drawer'
import PageHeader from '../components/ui/PageHeader'
import Segmented from '../components/ui/Segmented'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { ErrorState, KpiSkeletons, Skeleton } from '../components/ui/States'
import FilterBox from '../components/FilterBox'

const precise = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 6 })

/** Component quantities are per output unit and can be very small. */
function formatQuantityPrecise(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return precise.format(value)
}

type Tab = 'formulations' | 'production' | 'packing'

function matches(haystack: (string | null | undefined)[], needle: string): boolean {
  if (!needle) return true
  return haystack.some((value) => (value ?? '').toLowerCase().includes(needle))
}

function phaseLabel(phase: BomRow['phase']): string {
  return phase === 'PACKING' ? 'Packing' : 'Formulation'
}

function BomDetail({
  bom,
  components,
}: {
  bom: BomRow
  components: BomComponentRow[]
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Stage</p>
          <div className="mt-0.5">
            <StatusPill value={phaseLabel(bom.phase)} tone={bom.phase === 'PACKING' ? 'info' : 'brand'} />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {bom.phase === 'PACKING' ? 'Unpacked bulk + packaging' : 'Raw materials'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Output item</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{bom.outputItemName}</p>
          <p className="text-[11px] text-muted">{bom.outputItemCode || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Output quantity</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ink">
            {formatQuantityPrecise(bom.outputQuantity)} {bom.outputUnit.toLowerCase()}
          </p>
          <p className="text-[11px] text-muted">
            {formatNumber(bom.componentCount)} component{bom.componentCount === 1 ? '' : 's'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Status</p>
          <div className="mt-0.5">
            <StatusPill value={bom.isActive ? 'Active' : 'Inactive'} tone={bom.isActive ? 'ok' : 'neutral'} />
          </div>
          <p className="mt-1 text-[11px] text-muted">Created {formatDateTime(bom.createdAt)}</p>
        </div>
        {bom.notes && (
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Notes</p>
            <p className="mt-0.5 text-[12px] text-muted">{bom.notes}</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col" className="hidden sm:table-cell">Type</th>
              <th scope="col" className="text-right">Qty required</th>
              <th scope="col" className="text-right">Wastage</th>
            </tr>
          </thead>
          <tbody>
            {components.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-muted">
                  No components recorded for this BOM.
                </td>
              </tr>
            ) : (
              components.map((component) => (
                <tr key={component.id}>
                  <td>
                    <p className="text-[12px] font-bold text-ink">{component.itemName}</p>
                    <p className="text-[10px] text-muted">{component.itemCode}</p>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="text-[11px] font-semibold text-muted">
                      {titleCase(component.itemType)}
                    </span>
                  </td>
                  <td className="num whitespace-nowrap text-right text-[12px] font-semibold text-ink">
                    {formatQuantityPrecise(component.quantityRequired)} {component.unit.toLowerCase()}
                  </td>
                  <td className="num text-right text-[11px] text-muted">
                    {component.wastagePercent > 0
                      ? `${formatNumber(component.wastagePercent)}%`
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted">
        Quantities are per {formatQuantityPrecise(bom.outputQuantity)} {bom.outputUnit.toLowerCase()} of{' '}
        {bom.outputItemName}.
      </p>
    </div>
  )
}

function ConsumptionTable({
  title,
  rows,
}: {
  title: string
  rows: ManufacturingConsumptionRow[]
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{title}</p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col" className="text-right">Quantity</th>
              <th scope="col" className="text-right">Unit cost</th>
              <th scope="col" className="text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.itemCode}-${index}`}>
                <td>
                  <p className="text-[12px] font-bold text-ink">{row.itemName}</p>
                  <p className="text-[10px] text-muted">{row.itemCode}</p>
                </td>
                <td className="num whitespace-nowrap text-right">
                  {formatQuantityPrecise(row.quantity)} {row.unit.toLowerCase()}
                </td>
                <td className="num text-right">{formatCurrency(row.unitCost)}</td>
                <td className="num text-right font-semibold">{formatCurrency(row.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrderDetail({
  kind,
  order,
  consumption,
}: {
  kind: 'production' | 'packing'
  order: ProductionOrderRow | PackingOrderRow
  consumption: ManufacturingConsumptionRow[]
}) {
  const isProduction = kind === 'production'
  const production = isProduction ? (order as ProductionOrderRow) : null

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Order</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{order.orderNumber}</p>
          <p className="text-[11px] text-muted">{order.outputBatchNumber ?? 'No output batch'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Date</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{formatDate(order.manufacturingDate)}</p>
          <p className="text-[11px] text-muted">
            {order.expiryDate ? `Expires ${formatDate(order.expiryDate)}` : 'No expiry recorded'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Status</p>
          <div className="mt-0.5">
            <StatusPill value={order.status} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{order.warehouse ?? 'No warehouse'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">BOM</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{order.bomName || '—'}</p>
          <p className="text-[11px] text-muted">{isProduction ? 'Formulation' : 'Packing'} recipe</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Output item</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{order.outputItemName || '—'}</p>
          <p className="text-[11px] text-muted">{order.outputItemCode || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Created by</p>
          <p className="mt-0.5 text-[13px] font-bold text-ink">{order.createdBy ?? '—'}</p>
          <p className="text-[11px] text-muted">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Planned</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ink">
            {formatQuantityPrecise(order.plannedQuantity)} {order.outputUnit.toLowerCase()}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Actual</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ink">
            {formatQuantityPrecise(order.actualQuantity)} {order.outputUnit.toLowerCase()}
          </p>
        </div>
        {production ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Wastage</p>
            <p className="num mt-0.5 text-[13px] font-bold text-ink">
              {formatQuantityPrecise(production.wastageQuantity)} {order.outputUnit.toLowerCase()}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Batch</p>
            <p className="mt-0.5 text-[13px] font-bold text-ink">{order.outputBatchNumber ?? '—'}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Total cost</p>
          <p className="num mt-0.5 text-[13px] font-extrabold text-ink">
            {formatCurrency(order.productionCost)}
          </p>
        </div>
      </div>

      {production && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Raw material cost</p>
            <p className="num mt-0.5 text-[13px] font-bold text-ink">
              {formatCurrency(production.rawMaterialCost)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Packing material cost</p>
            <p className="num mt-0.5 text-[13px] font-bold text-ink">
              {formatCurrency(production.packingMaterialCost)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Completed</p>
            <p className="mt-0.5 text-[13px] font-bold text-ink">{formatDateTime(production.completedAt)}</p>
          </div>
        </div>
      )}

      {!production && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Completed</p>
            <p className="mt-0.5 text-[13px] font-bold text-ink">{formatDateTime(order.completedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Unit cost</p>
            <p className="num mt-0.5 text-[13px] font-bold text-ink">
              {order.actualQuantity > 0
                ? formatCurrency(order.productionCost / order.actualQuantity)
                : '—'}
            </p>
          </div>
        </div>
      )}

      {order.notes && (
        <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted">{order.notes}</p>
      )}

      {consumption.length > 0 ? (
        <ConsumptionTable title="Materials consumed" rows={consumption} />
      ) : (
        <p className="text-[11px] text-muted">
          No material-consumption lines recorded for this order.
        </p>
      )}
    </div>
  )
}

export default function ManufacturingPage() {
  const [tab, setTab] = useState<Tab>('formulations')
  const [bomSearch, setBomSearch] = useState('')
  const [phase, setPhase] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedBom, setSelectedBom] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<{ kind: 'production' | 'packing'; id: number } | null>(
    null,
  )

  const manufacturing = useQuery({
    queryKey: ['manufacturing'],
    queryFn: fetchManufacturing,
  })

  const data = manufacturing.data
  const boms = data?.boms ?? []
  const components = data?.components ?? []
  const productionOrders = data?.productionOrders ?? []
  const packingOrders = data?.packingOrders ?? []

  const componentsByBom = useMemo(() => {
    const map = new Map<number, BomComponentRow[]>()
    for (const component of components) {
      const list = map.get(component.bomId)
      if (list) list.push(component)
      else map.set(component.bomId, [component])
    }
    return map
  }, [components])

  const formationCount = boms.filter((bom) => bom.phase === 'FORMULATION').length
  const packingRecipeCount = boms.filter((bom) => bom.phase === 'PACKING').length
  const productionCost = productionOrders.reduce((sum, order) => sum + order.productionCost, 0)
  const packingCost = packingOrders.reduce((sum, order) => sum + order.productionCost, 0)

  const visibleBoms = useMemo(() => {
    const needle = bomSearch.trim().toLowerCase()
    return boms.filter((bom) => {
      if (phase && bom.phase !== phase) return false
      return matches([bom.name, bom.outputItemName, bom.outputItemCode], needle)
    })
  }, [boms, bomSearch, phase])

  const visibleProduction = useMemo(() => {
    const needle = orderSearch.trim().toLowerCase()
    return productionOrders.filter((order) => {
      if (status && order.status !== status) return false
      return matches(
        [order.orderNumber, order.bomName, order.outputItemName, order.outputItemCode, order.outputBatchNumber],
        needle,
      )
    })
  }, [productionOrders, orderSearch, status])

  const visiblePacking = useMemo(() => {
    const needle = orderSearch.trim().toLowerCase()
    return packingOrders.filter((order) => {
      if (status && order.status !== status) return false
      return matches(
        [order.orderNumber, order.bomName, order.outputItemName, order.outputItemCode, order.outputBatchNumber],
        needle,
      )
    })
  }, [packingOrders, orderSearch, status])

  const bomColumns: Column<BomRow>[] = [
    {
      key: 'bom',
      header: 'BOM',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-ink" title={row.name}>
            {row.name}
          </p>
          <p className="text-[10px] text-muted">{formatNumber(row.componentCount)} components</p>
        </div>
      ),
    },
    {
      key: 'phase',
      header: 'Stage',
      sortValue: (row) => row.phase,
      render: (row) => (
        <StatusPill
          value={phaseLabel(row.phase)}
          tone={row.phase === 'PACKING' ? 'info' : 'brand'}
        />
      ),
    },
    {
      key: 'output',
      header: 'Output item',
      sortValue: (row) => row.outputItemName,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-ink" title={row.outputItemName}>
            {row.outputItemName}
          </p>
          <p className="text-[10px] text-muted">{row.outputItemCode || '—'}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Output qty',
      align: 'right',
      sortValue: (row) => row.outputQuantity,
      render: (row) => (
        <span className="num whitespace-nowrap text-[12px] font-semibold text-ink">
          {formatQuantityPrecise(row.outputQuantity)} {row.outputUnit.toLowerCase()}
        </span>
      ),
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

  const productionColumns: Column<ProductionOrderRow>[] = [
    {
      key: 'order',
      header: 'Order #',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-bold text-ink">{row.orderNumber}</p>
          <p className="text-[10px] text-muted">{row.outputBatchNumber ?? 'No batch'}</p>
        </div>
      ),
    },
    {
      key: 'output',
      header: 'Product / BOM',
      sortValue: (row) => row.outputItemName,
      render: (row) => (
        <div className="min-w-0 max-w-[200px] sm:max-w-none">
          <p className="truncate text-[13px] font-semibold text-ink" title={row.outputItemName}>
            {row.outputItemName || '—'}
          </p>
          <p className="truncate text-[10px] text-muted">{row.bomName || 'No BOM'}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortValue: (row) => row.manufacturingDate,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatDate(row.manufacturingDate)}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'planned',
      header: 'Planned',
      align: 'right',
      sortValue: (row) => row.plannedQuantity,
      render: (row) => (
        <span className="num whitespace-nowrap text-[12px] text-muted">
          {formatQuantityPrecise(row.plannedQuantity)} {row.outputUnit.toLowerCase()}
        </span>
      ),
      hideBelow: 'lg',
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      sortValue: (row) => row.actualQuantity,
      render: (row) => (
        <span className="num whitespace-nowrap text-[12px] font-semibold text-ink">
          {formatQuantityPrecise(row.actualQuantity)} {row.outputUnit.toLowerCase()}
        </span>
      ),
    },
    {
      key: 'wastage',
      header: 'Wastage',
      align: 'right',
      sortValue: (row) => row.wastageQuantity,
      render: (row) => (
        <span className="num whitespace-nowrap text-[11px] text-muted">
          {row.wastageQuantity > 0 ? formatQuantityPrecise(row.wastageQuantity) : '—'}
        </span>
      ),
      hideBelow: 'xl',
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      sortValue: (row) => row.productionCost,
      render: (row) => (
        <span className="num whitespace-nowrap font-semibold text-ink">
          {formatCurrency(row.productionCost)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (row) => row.status,
      render: (row) => <StatusPill value={row.status} />,
      hideBelow: 'sm',
    },
  ]

  const packingColumns: Column<PackingOrderRow>[] = [
    {
      key: 'order',
      header: 'Order #',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-bold text-ink">{row.orderNumber}</p>
          <p className="text-[10px] text-muted">{row.outputBatchNumber ?? 'No batch'}</p>
        </div>
      ),
    },
    {
      key: 'output',
      header: 'Product / BOM',
      sortValue: (row) => row.outputItemName,
      render: (row) => (
        <div className="min-w-0 max-w-[200px] sm:max-w-none">
          <p className="truncate text-[13px] font-semibold text-ink" title={row.outputItemName}>
            {row.outputItemName || '—'}
          </p>
          <p className="truncate text-[10px] text-muted">{row.bomName || 'No BOM'}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortValue: (row) => row.manufacturingDate,
      render: (row) => <span className="num whitespace-nowrap text-muted">{formatDate(row.manufacturingDate)}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'planned',
      header: 'Planned',
      align: 'right',
      sortValue: (row) => row.plannedQuantity,
      render: (row) => (
        <span className="num whitespace-nowrap text-[12px] text-muted">
          {formatQuantityPrecise(row.plannedQuantity)} {row.outputUnit.toLowerCase()}
        </span>
      ),
      hideBelow: 'lg',
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      sortValue: (row) => row.actualQuantity,
      render: (row) => (
        <span className="num whitespace-nowrap text-[12px] font-semibold text-ink">
          {formatQuantityPrecise(row.actualQuantity)} {row.outputUnit.toLowerCase()}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      sortValue: (row) => row.productionCost,
      render: (row) => (
        <span className="num whitespace-nowrap font-semibold text-ink">
          {formatCurrency(row.productionCost)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (row) => row.status,
      render: (row) => <StatusPill value={row.status} />,
      hideBelow: 'sm',
    },
  ]

  const statusOptions = useMemo(
    () =>
      [...new Set([...productionOrders, ...packingOrders].map((order) => order.status))].sort(),
    [productionOrders, packingOrders],
  )

  const exportRows = (): void => {
    if (tab === 'formulations') {
      downloadCsv(
        'manufacturing-formulations.csv',
        visibleBoms.map((row) => ({
          bom: row.name,
          stage: phaseLabel(row.phase),
          outputItem: row.outputItemName,
          outputItemCode: row.outputItemCode,
          outputQuantity: row.outputQuantity,
          unit: row.outputUnit,
          components: row.componentCount,
          active: row.isActive ? 'Yes' : 'No',
        })),
        [
          { key: 'bom', label: 'BOM' },
          { key: 'stage', label: 'Stage' },
          { key: 'outputItem', label: 'Output item' },
          { key: 'outputItemCode', label: 'Output item code' },
          { key: 'outputQuantity', label: 'Output quantity' },
          { key: 'unit', label: 'Unit' },
          { key: 'components', label: 'Components' },
          { key: 'active', label: 'Active' },
        ],
      )
      return
    }

    if (tab === 'production') {
      downloadCsv(
        'manufacturing-production-orders.csv',
        visibleProduction.map((row) => ({
          order: row.orderNumber,
          date: row.manufacturingDate,
          bom: row.bomName,
          outputItem: row.outputItemName,
          planned: row.plannedQuantity,
          actual: row.actualQuantity,
          wastage: row.wastageQuantity,
          unit: row.outputUnit,
          batch: row.outputBatchNumber,
          cost: row.productionCost,
          status: row.status,
          warehouse: row.warehouse,
        })),
        [
          { key: 'order', label: 'Order #' },
          { key: 'date', label: 'Date' },
          { key: 'bom', label: 'BOM' },
          { key: 'outputItem', label: 'Output item' },
          { key: 'planned', label: 'Planned' },
          { key: 'actual', label: 'Actual' },
          { key: 'wastage', label: 'Wastage' },
          { key: 'unit', label: 'Unit' },
          { key: 'batch', label: 'Batch' },
          { key: 'cost', label: 'Cost' },
          { key: 'status', label: 'Status' },
          { key: 'warehouse', label: 'Warehouse' },
        ],
      )
      return
    }

    downloadCsv(
      'manufacturing-packing-orders.csv',
      visiblePacking.map((row) => ({
        order: row.orderNumber,
        date: row.manufacturingDate,
        bom: row.bomName,
        outputItem: row.outputItemName,
        planned: row.plannedQuantity,
        actual: row.actualQuantity,
        unit: row.outputUnit,
        batch: row.outputBatchNumber,
        cost: row.productionCost,
        status: row.status,
        warehouse: row.warehouse,
      })),
      [
        { key: 'order', label: 'Order #' },
        { key: 'date', label: 'Date' },
        { key: 'bom', label: 'BOM' },
        { key: 'outputItem', label: 'Output item' },
        { key: 'planned', label: 'Planned' },
        { key: 'actual', label: 'Actual' },
        { key: 'unit', label: 'Unit' },
        { key: 'batch', label: 'Batch' },
        { key: 'cost', label: 'Cost' },
        { key: 'status', label: 'Status' },
        { key: 'warehouse', label: 'Warehouse' },
      ],
    )
  }

  const selectedBomRow = boms.find((bom) => bom.id === selectedBom) ?? null
  const selectedOrderRow =
    selectedOrder?.kind === 'production'
      ? productionOrders.find((order) => order.id === selectedOrder.id) ?? null
      : selectedOrder?.kind === 'packing'
        ? packingOrders.find((order) => order.id === selectedOrder.id) ?? null
        : null
  const selectedConsumption =
    selectedOrder?.kind === 'production'
      ? (data?.productionConsumption ?? []).filter((row) => row.orderId === selectedOrder.id)
      : selectedOrder?.kind === 'packing'
        ? (data?.packingConsumption ?? []).filter((row) => row.orderId === selectedOrder.id)
        : []

  const exportCount =
    tab === 'formulations'
      ? visibleBoms.length
      : tab === 'production'
        ? visibleProduction.length
        : visiblePacking.length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Operations"
        title="Manufacturing"
        subtitle="Formulations, production runs and packing orders — read-only"
        actions={
          <button
            type="button"
            onClick={exportRows}
            disabled={exportCount === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
          >
            <Download size={14} aria-hidden />
            Export CSV
          </button>
        }
      />

      {manufacturing.isError ? (
        <ErrorState
          message={
            manufacturing.error instanceof Error
              ? manufacturing.error.message
              : 'Could not load manufacturing data.'
          }
          onRetry={() => manufacturing.refetch()}
        />
      ) : manufacturing.isLoading || !data ? (
        <>
          <KpiSkeletons count={4} />
          <Skeleton className="h-[320px] rounded-card" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              icon={FlaskConical}
              label="Formulations"
              value={formatNumber(formationCount)}
              hint="Raw-material recipes"
              tone="brand"
            />
            <StatCard
              icon={Boxes}
              label="Packing recipes"
              value={formatNumber(packingRecipeCount)}
              hint="Unpacked bulk + packaging"
              tone="teal"
            />
            <StatCard
              icon={Factory}
              label="Production runs"
              value={formatNumber(productionOrders.length)}
              hint={`${formatCompact(productionCost)} recorded`}
              tone="amber"
            />
            <StatCard
              icon={PackageCheck}
              label="Packing runs"
              value={formatNumber(packingOrders.length)}
              hint={`${formatCompact(packingCost)} recorded`}
              tone="ok"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="Manufacturing sections"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'formulations', label: `Formulations (${boms.length})` },
                { value: 'production', label: `Production (${productionOrders.length})` },
                { value: 'packing', label: `Packing (${packingOrders.length})` },
              ]}
            />
          </div>

          {tab === 'formulations' && (
            <Card
              title="Bills of materials"
              subtitle={`${formatNumber(visibleBoms.length)} of ${formatNumber(boms.length)} active BOMs`}
              action={
                <div className="flex flex-wrap items-end gap-2">
                  <FilterBox
                    value={bomSearch}
                    onChange={setBomSearch}
                    placeholder="Search BOM or product…"
                    className="w-full sm:w-[210px]"
                  />
                  <select
                    value={phase}
                    onChange={(event) => setPhase(event.target.value)}
                    aria-label="Filter by stage"
                    className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">All stages</option>
                    <option value="FORMULATION">Formulation</option>
                    <option value="PACKING">Packing</option>
                  </select>
                </div>
              }
            >
              <DataTable
                columns={bomColumns}
                rows={visibleBoms}
                rowKey={(row) => row.id}
                initialSortKey="bom"
                pageSize={25}
                onRowClick={(row) => setSelectedBom(row.id)}
                emptyTitle="No BOMs match these filters"
                emptyHint="Clear the search or stage filter, or create a BOM in the ERP."
                caption="Bills of materials"
              />
              <p className="mt-3 text-[11px] text-muted">
                Click a BOM to see its components and quantities per output.
              </p>
            </Card>
          )}

          {tab === 'production' && (
            <Card
              title="Production orders"
              subtitle={`${formatNumber(visibleProduction.length)} of ${formatNumber(productionOrders.length)} formulation runs`}
              action={
                <div className="flex flex-wrap items-end gap-2">
                  <FilterBox
                    value={orderSearch}
                    onChange={setOrderSearch}
                    placeholder="Search order, BOM or product…"
                    className="w-full sm:w-[210px]"
                  />
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label="Filter by status"
                    className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              }
            >
              <DataTable
                columns={productionColumns}
                rows={visibleProduction}
                rowKey={(row) => row.id}
                initialSortKey="date"
                initialSortDir="desc"
                pageSize={25}
                onRowClick={(row) => setSelectedOrder({ kind: 'production', id: row.id })}
                emptyTitle="No production orders match these filters"
                emptyHint="Clear the search or status filter, or start a production run in the ERP."
                caption="Production orders"
              />
              <p className="mt-3 text-[11px] text-muted">
                Click an order to see costs, dates and consumed raw materials.
              </p>
            </Card>
          )}

          {tab === 'packing' && (
            <Card
              title="Packing orders"
              subtitle={`${formatNumber(visiblePacking.length)} of ${formatNumber(packingOrders.length)} packing runs`}
              action={
                <div className="flex flex-wrap items-end gap-2">
                  <FilterBox
                    value={orderSearch}
                    onChange={setOrderSearch}
                    placeholder="Search order, BOM or product…"
                    className="w-full sm:w-[210px]"
                  />
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label="Filter by status"
                    className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              }
            >
              <DataTable
                columns={packingColumns}
                rows={visiblePacking}
                rowKey={(row) => row.id}
                initialSortKey="date"
                initialSortDir="desc"
                pageSize={25}
                onRowClick={(row) => setSelectedOrder({ kind: 'packing', id: row.id })}
                emptyTitle="No packing orders match these filters"
                emptyHint="Clear the search or status filter, or start a packing run in the ERP."
                caption="Packing orders"
              />
              <p className="mt-3 text-[11px] text-muted">
                Click an order to see costs, dates and consumed packing materials.
              </p>
            </Card>
          )}
        </>
      )}

      <Drawer
        open={selectedBomRow != null}
        onClose={() => setSelectedBom(null)}
        title={selectedBomRow?.name ?? 'Bill of materials'}
        subtitle="Read-only detail · components and output"
        width="wide"
      >
        {selectedBomRow && (
          <BomDetail
            bom={selectedBomRow}
            components={componentsByBom.get(selectedBomRow.id) ?? []}
          />
        )}
      </Drawer>

      <Drawer
        open={selectedOrderRow != null}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrderRow?.orderNumber ?? 'Manufacturing order'}
        subtitle={
          selectedOrder?.kind === 'production'
            ? 'Read-only detail · production run'
            : 'Read-only detail · packing run'
        }
        width="wide"
      >
        {selectedOrderRow && selectedOrder && (
          <OrderDetail
            kind={selectedOrder.kind}
            order={selectedOrderRow}
            consumption={selectedConsumption}
          />
        )}
      </Drawer>
    </div>
  )
}
