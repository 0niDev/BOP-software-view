/** Inventory queries: stock on hand, value and low-stock detection. */
import { query } from '../sqlitecloud'
import type { StockRow } from '../types'

export async function fetchStock(): Promise<StockRow[]> {
  const rows = await query<{
    item_code: string
    item_name: string
    unit: string
    total_stock: number
    minimum_stock: number
    total_value: number
    batch_count: number
  }>(
    `SELECT i.item_code, i.item_name, i.unit,
            COALESCE(SUM(sb.quantity_in_stock), 0) AS total_stock,
            i.minimum_stock,
            COALESCE(SUM(sb.quantity_in_stock * sb.purchase_price), 0) AS total_value,
            COUNT(DISTINCT sb.batch_number) AS batch_count
     FROM items i
     LEFT JOIN stock_batches sb ON sb.item_id = i.id AND sb.is_active = 1
     WHERE i.is_active = 1
     GROUP BY i.id
     ORDER BY total_stock DESC`,
  )

  return rows.map((r) => ({
    itemCode: r.item_code,
    itemName: r.item_name,
    unit: r.unit,
    totalStock: r.total_stock,
    minimumStock: r.minimum_stock,
    stockValue: r.total_value,
    batchCount: r.batch_count,
    isLow: r.total_stock <= (r.minimum_stock ?? 0),
  }))
}
