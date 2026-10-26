/** Sales and purchase invoice lists plus line-item detail. */
import { query, safeId } from '../sqlitecloud'
import { COMPANY_ID } from '../constants'
import type { InvoiceDetail, InvoiceItem, InvoiceKind, InvoiceRow } from '../types'

const isSales = (kind: InvoiceKind): boolean => kind === 'sales'

function invoiceSql(kind: InvoiceKind, where = ''): string {
  const sales = isSales(kind)
  const partyId = sales ? 'si.customer_id' : 'pi.supplier_id'
  const alias = sales ? 'si' : 'pi'
  const table = sales ? 'sales_invoices' : 'purchase_invoices'
  return `SELECT ${alias}.id,
                 ${alias}.invoice_number AS invoiceNumber,
                 p.code AS partyCode,
                 p.name AS partyName,
                 ${alias}.invoice_date AS date,
                 ${alias}.payment_type AS paymentType,
                 ${alias}.subtotal,
                 ${alias}.discount_amount AS discountAmount,
                 ${alias}.tax_amount AS taxAmount,
                 ${alias}.total_amount AS totalAmount,
                 ${alias}.paid_amount AS paidAmount,
                 ${alias}.status,
                 w.name AS warehouse,
                 ${alias}.notes
          FROM ${table} ${alias}
          JOIN parties p ON p.id = ${partyId}
          LEFT JOIN warehouses w ON w.id = ${alias}.warehouse_id
          WHERE ${alias}.company_id = ${COMPANY_ID} AND ${alias}.status != 'CANCELLED'
          ${where}
          ORDER BY ${alias}.invoice_date DESC, ${alias}.id DESC`
}

function mapInvoice(row: InvoiceRow): InvoiceRow {
  const total = Number(row.totalAmount ?? 0)
  const paid = Number(row.paidAmount ?? 0)
  return {
    ...row,
    totalAmount: total,
    paidAmount: paid,
    subtotal: Number(row.subtotal ?? 0),
    discountAmount: Number(row.discountAmount ?? 0),
    taxAmount: Number(row.taxAmount ?? 0),
    balance: total - paid,
  }
}

export async function fetchInvoices(kind: InvoiceKind): Promise<InvoiceRow[]> {
  const rows = await query<InvoiceRow>(invoiceSql(kind))
  return rows.map(mapInvoice)
}

function itemsSql(kind: InvoiceKind, invoiceId: number): string {
  if (isSales(kind)) {
    return `SELECT sii.id, i.item_code AS itemCode, i.item_name AS itemName, i.unit,
                   sii.quantity, sii.unit_price AS unitPrice,
                   sii.discount_amount AS discountAmount, sii.tax_amount AS taxAmount,
                   sii.line_total AS lineTotal,
                   sb.batch_number AS batchNumber, sb.expiry_date AS expiryDate
            FROM sales_invoice_items sii
            JOIN items i ON i.id = sii.item_id
            LEFT JOIN stock_batches sb ON sb.id = sii.batch_id
            WHERE sii.invoice_id = ${invoiceId}
            ORDER BY sii.id`
  }
  return `SELECT pii.id, i.item_code AS itemCode, i.item_name AS itemName, i.unit,
                 pii.quantity, pii.unit_cost AS unitPrice,
                 pii.discount_amount AS discountAmount, pii.tax_amount AS taxAmount,
                 pii.line_total AS lineTotal,
                 pii.batch_number AS batchNumber, pii.expiry_date AS expiryDate
          FROM purchase_invoice_items pii
          JOIN items i ON i.id = pii.item_id
          WHERE pii.invoice_id = ${invoiceId}
          ORDER BY pii.id`
}

export async function fetchInvoiceDetail(
  kind: InvoiceKind,
  invoiceId: number | string,
): Promise<InvoiceDetail> {
  const id = safeId(invoiceId)
  const [invoiceRows, itemRows] = await Promise.all([
    query<InvoiceRow>(invoiceSql(kind, `AND ${isSales(kind) ? 'si' : 'pi'}.id = ${id}`)),
    query<InvoiceItem>(itemsSql(kind, id)),
  ])

  const invoice = invoiceRows[0]
  if (!invoice) throw new Error('Invoice not found')

  return {
    invoice: mapInvoice(invoice),
    items: itemRows.map((item) => ({
      ...item,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      discountAmount: Number(item.discountAmount ?? 0),
      taxAmount: Number(item.taxAmount ?? 0),
      lineTotal: Number(item.lineTotal ?? 0),
    })),
  }
}

export interface InvoiceStats {
  count: number
  total: number
  paid: number
  outstanding: number
}

export function invoiceStats(rows: InvoiceRow[]): InvoiceStats {
  return rows.reduce<InvoiceStats>(
    (stats, row) => ({
      count: stats.count + 1,
      total: stats.total + row.totalAmount,
      paid: stats.paid + row.paidAmount,
      outstanding: stats.outstanding + Math.max(row.balance, 0),
    }),
    { count: 0, total: 0, paid: 0, outstanding: 0 },
  )
}
