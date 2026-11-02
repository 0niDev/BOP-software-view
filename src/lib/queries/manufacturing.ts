/**
 * Read-only manufacturing data: bills of materials, production orders and
 * packing orders, mirroring the ERP's Manufacturing module.
 *
 * The ERP runs two independent stages — formulation (raw materials) and packing
 * (unpacked bulk + packaging) — so both order tables are read side by side.
 */
import { query } from '../sqlitecloud'
import { COMPANY_ID } from '../constants'
import type {
  BomComponentRow,
  BomRow,
  ManufacturingConsumptionRow,
  ManufacturingData,
  PackingOrderRow,
  ProductionOrderRow,
} from '../types'

const n = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const s = (value: unknown): string => (value == null ? '' : String(value))

async function fetchBoms(): Promise<BomRow[]> {
  const rows = await query<{
    id: number
    bom_name: string
    phase: string | null
    output_item_code: string
    output_item_name: string
    output_unit: string
    output_quantity: number
    component_count: number
    notes: string | null
    is_active: number
    created_at: string
  }>(
    `SELECT b.id, b.bom_name, b.phase,
            i.item_code AS output_item_code,
            i.item_name AS output_item_name,
            i.unit AS output_unit,
            b.output_quantity, b.notes, b.is_active, b.created_at,
            COUNT(bc.id) AS component_count
     FROM bill_of_materials b
     JOIN items i ON i.id = b.finished_item_id
     LEFT JOIN bom_components bc ON bc.bom_id = b.id
     WHERE b.company_id = ${COMPANY_ID} AND b.is_active = 1 AND b.is_ghost = 0
     GROUP BY b.id, b.bom_name, b.phase, i.item_code, i.item_name, i.unit,
              b.output_quantity, b.notes, b.is_active, b.created_at
     ORDER BY b.phase, b.bom_name`,
  )

  return rows.map((row) => ({
    id: row.id,
    name: row.bom_name,
    phase: row.phase === 'PACKING' ? 'PACKING' : 'FORMULATION',
    outputItemCode: row.output_item_code,
    outputItemName: row.output_item_name,
    outputUnit: row.output_unit,
    outputQuantity: n(row.output_quantity),
    componentCount: n(row.component_count),
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  }))
}

async function fetchBomComponents(): Promise<BomComponentRow[]> {
  const rows = await query<{
    id: number
    bom_id: number
    item_code: string
    item_name: string
    item_type: string
    unit: string
    quantity_required: number
    wastage_percent: number
  }>(
    `SELECT bc.id, bc.bom_id, bc.quantity_required, bc.wastage_percent,
            i.item_code, i.item_name, i.item_type, i.unit
     FROM bom_components bc
     JOIN bill_of_materials b ON b.id = bc.bom_id
     JOIN items i ON i.id = bc.component_item_id
     WHERE b.company_id = ${COMPANY_ID} AND b.is_active = 1 AND b.is_ghost = 0
     ORDER BY bc.bom_id, bc.id`,
  )

  return rows.map((row) => ({
    id: row.id,
    bomId: row.bom_id,
    itemCode: row.item_code,
    itemName: row.item_name,
    itemType: row.item_type,
    unit: row.unit,
    quantityRequired: n(row.quantity_required),
    wastagePercent: n(row.wastage_percent),
  }))
}

async function fetchProductionOrders(): Promise<ProductionOrderRow[]> {
  const rows = await query<{
    id: number
    order_number: string
    status: string
    bom_name: string | null
    output_item_code: string | null
    output_item_name: string | null
    output_unit: string | null
    warehouse: string | null
    created_by: string | null
    manufacturing_date: string
    expiry_date: string | null
    planned_quantity: number
    actual_quantity: number
    wastage_quantity: number
    output_batch_number: string | null
    production_cost: number
    raw_material_cost: number
    packing_material_cost: number
    notes: string | null
    created_at: string
    completed_at: string | null
  }>(
    `SELECT po.id, po.order_number, po.status, po.manufacturing_date, po.expiry_date,
            po.planned_quantity, po.actual_quantity, po.wastage_quantity,
            po.output_batch_number, po.production_cost, po.raw_material_cost,
            po.packing_material_cost, po.notes, po.created_at, po.completed_at,
            b.bom_name,
            i.item_code AS output_item_code,
            i.item_name AS output_item_name,
            i.unit AS output_unit,
            w.name AS warehouse,
            u.full_name AS created_by
     FROM production_orders po
     LEFT JOIN bill_of_materials b ON b.id = po.bom_id
     LEFT JOIN items i ON i.id = b.finished_item_id
     LEFT JOIN warehouses w ON w.id = po.warehouse_id
     LEFT JOIN users u ON u.id = po.created_by
     WHERE po.company_id = ${COMPANY_ID} AND po.is_ghost = 0
     ORDER BY po.manufacturing_date DESC, po.id DESC
     LIMIT 200`,
  )

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    bomName: s(row.bom_name),
    outputItemCode: s(row.output_item_code),
    outputItemName: s(row.output_item_name),
    outputUnit: s(row.output_unit),
    warehouse: row.warehouse,
    createdBy: row.created_by,
    manufacturingDate: row.manufacturing_date,
    expiryDate: row.expiry_date,
    plannedQuantity: n(row.planned_quantity),
    actualQuantity: n(row.actual_quantity),
    wastageQuantity: n(row.wastage_quantity),
    outputBatchNumber: row.output_batch_number,
    productionCost: n(row.production_cost),
    rawMaterialCost: n(row.raw_material_cost),
    packingMaterialCost: n(row.packing_material_cost),
    notes: row.notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }))
}

async function fetchPackingOrders(): Promise<PackingOrderRow[]> {
  const rows = await query<{
    id: number
    order_number: string
    status: string
    bom_name: string | null
    output_item_code: string | null
    output_item_name: string | null
    output_unit: string | null
    warehouse: string | null
    created_by: string | null
    manufacturing_date: string
    expiry_date: string | null
    planned_quantity: number
    actual_quantity: number
    output_batch_number: string | null
    production_cost: number
    notes: string | null
    created_at: string
    completed_at: string | null
  }>(
    `SELECT pk.id, pk.order_number, pk.status, pk.manufacturing_date, pk.expiry_date,
            pk.planned_quantity, pk.actual_quantity, pk.output_batch_number,
            pk.production_cost, pk.notes, pk.created_at, pk.completed_at,
            b.bom_name,
            i.item_code AS output_item_code,
            i.item_name AS output_item_name,
            i.unit AS output_unit,
            w.name AS warehouse,
            u.full_name AS created_by
     FROM packing_orders pk
     LEFT JOIN bill_of_materials b ON b.id = pk.bom_id
     LEFT JOIN items i ON i.id = b.finished_item_id
     LEFT JOIN warehouses w ON w.id = pk.warehouse_id
     LEFT JOIN users u ON u.id = pk.created_by
     WHERE pk.company_id = ${COMPANY_ID}
     ORDER BY pk.manufacturing_date DESC, pk.id DESC
     LIMIT 200`,
  )

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    bomName: s(row.bom_name),
    outputItemCode: s(row.output_item_code),
    outputItemName: s(row.output_item_name),
    outputUnit: s(row.output_unit),
    warehouse: row.warehouse,
    createdBy: row.created_by,
    manufacturingDate: row.manufacturing_date,
    expiryDate: row.expiry_date,
    plannedQuantity: n(row.planned_quantity),
    actualQuantity: n(row.actual_quantity),
    outputBatchNumber: row.output_batch_number,
    productionCost: n(row.production_cost),
    notes: row.notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }))
}

async function fetchConsumption(
  table: 'production_consumption' | 'packing_consumption',
  orderColumn: 'production_order_id' | 'packing_order_id',
  ordersTable: 'production_orders' | 'packing_orders',
): Promise<ManufacturingConsumptionRow[]> {
  const rows = await query<{
    order_id: number
    item_code: string
    item_name: string
    unit: string
    quantity_consumed: number
    unit_cost: number
    cost: number
  }>(
    `SELECT c.${orderColumn} AS order_id, i.item_code, i.item_name, i.unit,
            c.quantity_consumed, c.unit_cost,
            ROUND(c.quantity_consumed * c.unit_cost, 2) AS cost
     FROM ${table} c
     JOIN ${ordersTable} o ON o.id = c.${orderColumn}
     JOIN items i ON i.id = c.component_item_id
     WHERE o.company_id = ${COMPANY_ID}
     ORDER BY c.${orderColumn}, c.id`,
  )

  return rows.map((row) => ({
    orderId: row.order_id,
    itemCode: row.item_code,
    itemName: row.item_name,
    unit: row.unit,
    quantity: n(row.quantity_consumed),
    unitCost: n(row.unit_cost),
    cost: n(row.cost),
  }))
}

export async function fetchManufacturing(): Promise<ManufacturingData> {
  const [
    boms,
    components,
    productionOrders,
    packingOrders,
    productionConsumption,
    packingConsumption,
  ] = await Promise.all([
    fetchBoms(),
    fetchBomComponents(),
    fetchProductionOrders(),
    fetchPackingOrders(),
    fetchConsumption('production_consumption', 'production_order_id', 'production_orders'),
    fetchConsumption('packing_consumption', 'packing_order_id', 'packing_orders'),
  ])

  return {
    boms,
    components,
    productionOrders,
    packingOrders,
    productionConsumption,
    packingConsumption,
  }
}
