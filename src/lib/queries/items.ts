/** Item catalogue with live stock on hand and value. */
import { query } from '../sqlitecloud'
import { COMPANY_ID } from '../constants'
import type { ItemRow } from '../types'

const n = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function fetchItems(includeInactive = false): Promise<ItemRow[]> {
  const rows = await query<{
    id: number
    item_code: string
    item_name: string
    item_type: string
    unit: string
    category: string | null
    minimum_stock: number
    purchase_price: number
    selling_price: number
    stock: number
    stock_value: number
    batch_count: number
    nearest_expiry: string | null
    is_active: number
  }>(
    `SELECT i.id, i.item_code, i.item_name, i.item_type, i.unit,
            ic.name AS category,
            i.minimum_stock,
            COALESCE(
              NULLIF(i.purchase_price, 0),
              ROUND(SUM(sb.quantity_in_stock * sb.purchase_price) / NULLIF(SUM(sb.quantity_in_stock), 0), 2),
              0
            ) AS purchase_price,
            i.selling_price,
            COALESCE(SUM(sb.quantity_in_stock), 0) AS stock,
            COALESCE(SUM(sb.quantity_in_stock * sb.purchase_price), 0) AS stock_value,
            COUNT(DISTINCT CASE WHEN sb.quantity_in_stock > 0 THEN sb.batch_number END) AS batch_count,
            MIN(CASE WHEN sb.quantity_in_stock > 0 THEN sb.expiry_date END) AS nearest_expiry,
            i.is_active
     FROM items i
     LEFT JOIN stock_batches sb ON sb.item_id = i.id AND sb.is_active = 1
     LEFT JOIN item_categories ic ON ic.id = i.category_id
     WHERE i.company_id = ${COMPANY_ID}
       ${includeInactive ? '' : 'AND i.is_active = 1'}
     GROUP BY i.id, i.item_code, i.item_name, i.item_type, i.unit, ic.name,
              i.minimum_stock, i.purchase_price, i.selling_price, i.is_active
     ORDER BY i.item_name`,
  )

  return rows.map((row) => ({
    id: row.id,
    itemCode: row.item_code,
    itemName: row.item_name,
    itemType: row.item_type,
    unit: row.unit,
    category: row.category,
    minimumStock: n(row.minimum_stock),
    purchasePrice: n(row.purchase_price),
    sellingPrice: n(row.selling_price),
    stock: n(row.stock),
    stockValue: n(row.stock_value),
    batchCount: n(row.batch_count),
    nearestExpiry: row.nearest_expiry,
    isActive: row.is_active === 1,
  }))
}
