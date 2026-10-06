/** Invoice list queries (most recent 50, cancelled excluded). */
import { query } from '../sqlitecloud'
import type { InvoiceRow } from '../types'

export async function fetchSalesInvoices(): Promise<InvoiceRow[]> {
  const rows = await query<{
    invoice_number: string
    customer_name: string | null
    invoice_date: string
    total_amount: number
    paid_amount: number | null
    status: string
  }>(
    `SELECT si.invoice_number, p.name AS customer_name, si.invoice_date,
            si.total_amount, si.paid_amount, si.status
     FROM sales_invoices si
     JOIN parties p ON p.id = si.customer_id
     WHERE si.status != 'CANCELLED'
     ORDER BY si.invoice_date DESC LIMIT 50`,
  )

  return rows.map((r) => ({
    invoiceNumber: r.invoice_number,
    partyName: r.customer_name ?? 'Unknown',
    date: r.invoice_date,
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount ?? 0,
    balance: r.total_amount - (r.paid_amount ?? 0),
    status: r.status,
  }))
}

export async function fetchPurchaseInvoices(): Promise<InvoiceRow[]> {
  const rows = await query<{
    invoice_number: string
    supplier_name: string | null
    invoice_date: string
    total_amount: number
    paid_amount: number | null
    status: string
  }>(
    `SELECT pi.invoice_number, p.name AS supplier_name, pi.invoice_date,
            pi.total_amount, pi.paid_amount, pi.status
     FROM purchase_invoices pi
     JOIN parties p ON p.id = pi.supplier_id
     WHERE pi.status != 'CANCELLED'
     ORDER BY pi.invoice_date DESC LIMIT 50`,
  )

  return rows.map((r) => ({
    invoiceNumber: r.invoice_number,
    partyName: r.supplier_name ?? 'Unknown',
    date: r.invoice_date,
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount ?? 0,
    balance: r.total_amount - (r.paid_amount ?? 0),
    status: r.status,
  }))
}
