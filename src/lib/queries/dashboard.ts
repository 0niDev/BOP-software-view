/**
 * Dashboard aggregates, mirroring web/server/src/services/dashboardService.ts.
 * Everything is journal-derived and excludes cancelled invoices; the result is
 * one typed object so a page can render a whole executive grid from one query
 * batch.
 */
import { query } from '../sqlitecloud'
import { COMPANY_ID } from '../constants'
import type {
  CustomerSale,
  DashboardAlert,
  DashboardData,
  ExpiringItem,
  LowStockItem,
  RecentTransaction,
  TopItem,
  TrendPoint,
} from '../types'

const n = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const RECENT_LIMIT = 15
const LOW_STOCK_LIMIT = 10
const EXPIRING_LIMIT = 10
const TOP_ITEM_LIMIT = 8
const TOP_CUSTOMER_LIMIT = 6

export async function fetchDashboard(): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`
  const company = COMPANY_ID

  const [
    salesRows,
    purchaseRows,
    balanceRows,
    monthRows,
    inventoryRows,
    itemCountRows,
    recentRows,
    lowStockRows,
    expiringRows,
    trendRows,
    topItemRows,
    customerRows,
  ] = await Promise.all([
    query<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count
       FROM sales_invoices
       WHERE company_id = ${company} AND date(invoice_date) = date('${today}')
         AND status != 'CANCELLED'`,
    ),
    query<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count
       FROM purchase_invoices
       WHERE company_id = ${company} AND date(invoice_date) = date('${today}')
         AND status != 'CANCELLED'`,
    ),
    query<{ cash: number; bank: number; receivable: number; payable: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN a.account_code IN ('1000','1020') THEN jel.debit - jel.credit ELSE 0 END), 0) AS cash,
         COALESCE(SUM(CASE WHEN a.account_code = '1010' THEN jel.debit - jel.credit ELSE 0 END), 0) AS bank,
         COALESCE(SUM(CASE WHEN a.account_code = '1100' THEN jel.debit - jel.credit ELSE 0 END), 0) AS receivable,
         COALESCE(SUM(CASE WHEN a.account_code = '2000' THEN jel.credit - jel.debit ELSE 0 END), 0) AS payable
       FROM journal_entries je
       JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
       JOIN accounts a ON a.id = jel.account_id
       WHERE je.is_posted = 1 AND je.company_id = ${company}`,
    ),
    query<{ revenue: number; expenses: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN a.account_type = 'REVENUE' THEN jel.credit ELSE 0 END), 0) AS revenue,
         COALESCE(SUM(CASE WHEN a.account_type = 'EXPENSE' THEN jel.debit ELSE 0 END), 0) AS expenses
       FROM journal_entries je
       JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
       JOIN accounts a ON a.id = jel.account_id
       WHERE je.is_posted = 1 AND je.company_id = ${company}
         AND je.entry_date >= '${monthStart}' AND je.entry_date <= '${today}'`,
    ),
    query<{ value: number | null }>(
      `SELECT COALESCE(
         (SELECT SUM(sb.quantity_in_stock * sb.purchase_price)
          FROM stock_batches sb
          JOIN items i ON i.id = sb.item_id
          WHERE sb.is_active = 1 AND i.is_active = 1 AND i.company_id = ${company}
            AND sb.quantity_in_stock > 0),
         (SELECT COALESCE(SUM(jel.debit - jel.credit), 0)
          FROM journal_entry_lines jel
          JOIN journal_entries je ON je.id = jel.journal_entry_id
          JOIN accounts a ON a.id = jel.account_id
          WHERE je.is_posted = 1 AND je.company_id = ${company}
            AND a.account_code IN ('1200','1210','1220'))
       ) AS value`,
    ),
    query<{ count: number; configured: number }>(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(CASE WHEN minimum_stock > 0 THEN 1 ELSE 0 END), 0) AS configured
       FROM items WHERE company_id = ${company} AND is_active = 1`,
    ),
    query<RecentTransaction>(
      `SELECT * FROM (
         SELECT si.invoice_number AS reference, si.invoice_date AS date, 'Sales' AS type,
                si.total_amount AS amount, p.name AS partyName
         FROM sales_invoices si JOIN parties p ON p.id = si.customer_id
         WHERE si.company_id = ${company} AND si.status != 'CANCELLED'
         UNION ALL
         SELECT pi.invoice_number, pi.invoice_date, 'Purchases', pi.total_amount, p.name
         FROM purchase_invoices pi JOIN parties p ON p.id = pi.supplier_id
         WHERE pi.company_id = ${company} AND pi.status != 'CANCELLED'
         UNION ALL
         SELECT pay.voucher_number, pay.payment_date, 'Payment', pay.amount, pa.name
         FROM payments pay JOIN parties pa ON pa.id = pay.party_id
         WHERE pay.company_id = ${company}
         UNION ALL
         SELECT r.voucher_number, r.receipt_date, 'Receipt', r.amount, pa.name
         FROM receipts r JOIN parties pa ON pa.id = r.party_id
         WHERE r.company_id = ${company}
         UNION ALL
         SELECT e.voucher_number, e.expense_date, 'Expense', e.amount, ec.name
         FROM expenses e JOIN expense_categories ec ON ec.id = e.category_id
         WHERE e.company_id = ${company}
       )
       ORDER BY date DESC, reference DESC
       LIMIT ${RECENT_LIMIT}`,
    ),
    query<{ item_code: string; item_name: string; unit: string; current_stock: number; minimum_stock: number }>(
      `SELECT i.item_code, i.item_name, i.unit,
              COALESCE(SUM(sb.quantity_in_stock), 0) AS current_stock,
              i.minimum_stock
       FROM items i
       LEFT JOIN stock_batches sb ON sb.item_id = i.id AND sb.is_active = 1
       WHERE i.company_id = ${company} AND i.is_active = 1
       GROUP BY i.id, i.item_code, i.item_name, i.unit, i.minimum_stock
       HAVING current_stock < i.minimum_stock
       ORDER BY CASE WHEN i.minimum_stock > 0 THEN current_stock / i.minimum_stock ELSE 0 END ASC
       LIMIT ${LOW_STOCK_LIMIT}`,
    ),
    query<{ item_code: string; item_name: string; unit: string; batch_number: string; expiry_date: string | null; quantity_in_stock: number }>(
      `SELECT i.item_code, i.item_name, i.unit, sb.batch_number, sb.expiry_date, sb.quantity_in_stock
       FROM stock_batches sb
       JOIN items i ON i.id = sb.item_id
       WHERE sb.is_active = 1 AND i.is_active = 1 AND i.company_id = ${company}
         AND sb.quantity_in_stock > 0
         AND sb.expiry_date IS NOT NULL
         AND date(sb.expiry_date) <= date('${today}', '+30 days')
       ORDER BY sb.expiry_date ASC
       LIMIT ${EXPIRING_LIMIT}`,
    ),
    query<{ month: string; revenue: number; expenses: number }>(
      `WITH RECURSIVE months(month_start) AS (
         SELECT date('${today}', 'start of month', '-5 months')
         UNION ALL
         SELECT date(month_start, '+1 month') FROM months
         WHERE month_start < date('${today}', 'start of month')
       )
       SELECT m.month_start AS month,
              COALESCE(SUM(CASE WHEN a.account_type = 'REVENUE' THEN jel.credit ELSE 0 END), 0) AS revenue,
              COALESCE(SUM(
                CASE
                  WHEN a.account_type = 'EXPENSE' THEN jel.debit
                  WHEN a.account_code IN ('5000','5001','5002') THEN jel.debit
                  ELSE 0
                END
              ), 0) AS expenses
       FROM months m
       LEFT JOIN journal_entries je
         ON je.is_posted = 1 AND je.company_id = ${company}
         AND date(je.entry_date) >= m.month_start
         AND date(je.entry_date) < date(m.month_start, '+1 month')
       LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
       LEFT JOIN accounts a ON a.id = jel.account_id
       GROUP BY m.month_start
       ORDER BY m.month_start ASC`,
    ),
    query<{ item_code: string; item_name: string; quantity: number; revenue: number; customers: number }>(
      `SELECT i.item_code, i.item_name,
              COALESCE(SUM(sii.quantity), 0) AS quantity,
              COALESCE(SUM(sii.line_total), 0) AS revenue,
              COUNT(DISTINCT si.customer_id) AS customers
       FROM sales_invoice_items sii
       JOIN sales_invoices si ON si.id = sii.invoice_id
       JOIN items i ON i.id = sii.item_id
       WHERE si.company_id = ${company} AND si.status != 'CANCELLED'
       GROUP BY i.id, i.item_code, i.item_name
       ORDER BY revenue DESC, quantity DESC
       LIMIT ${TOP_ITEM_LIMIT}`,
    ),
    query<{ party_name: string; revenue: number; invoices: number }>(
      `SELECT p.name AS party_name,
              COALESCE(SUM(si.total_amount), 0) AS revenue,
              COUNT(*) AS invoices
       FROM sales_invoices si
       JOIN parties p ON p.id = si.customer_id
       WHERE si.company_id = ${company} AND si.status != 'CANCELLED'
       GROUP BY p.id, p.name
       ORDER BY revenue DESC, p.name ASC
       LIMIT ${TOP_CUSTOMER_LIMIT}`,
    ),
  ])

  const sales = salesRows[0]
  const purchases = purchaseRows[0]
  const balances = balanceRows[0]
  const month = monthRows[0]
  const inventory = n(inventoryRows[0]?.value)
  const cash = n(balances?.cash)
  const bank = n(balances?.bank)
  const revenue = n(month?.revenue)
  const expenses = n(month?.expenses)

  const lowStockItems: LowStockItem[] = lowStockRows.map((row) => ({
    itemCode: row.item_code,
    itemName: row.item_name,
    unit: row.unit,
    currentStock: n(row.current_stock),
    minimumStock: n(row.minimum_stock),
  }))

  const expiringItems: ExpiringItem[] = expiringRows.map((row) => ({
    itemCode: row.item_code,
    itemName: row.item_name,
    unit: row.unit,
    batchNumber: row.batch_number,
    expiryDate: row.expiry_date,
    quantityInStock: n(row.quantity_in_stock),
  }))

  const minimumConfigured = n(itemCountRows[0]?.configured)

  const alerts: DashboardAlert[] = []
  for (const item of lowStockItems.slice(0, 5)) {
    alerts.push({
      type: 'warning',
      title: `Low stock: ${item.itemCode}`,
      message: `${item.itemName} — ${item.currentStock.toFixed(2)} ${item.unit.toLowerCase()} on hand, minimum ${item.minimumStock.toFixed(2)}.`,
    })
  }
  for (const batch of expiringItems.slice(0, 3)) {
    alerts.push({
      type: 'danger',
      title: `Expiring soon: ${batch.batchNumber}`,
      message: `${batch.itemName} — expires ${batch.expiryDate ?? 'unknown'}.`,
    })
  }
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      title: 'All clear',
      message:
        minimumConfigured === 0
          ? 'No expiry alerts. No minimum stock levels are configured, so low-stock checks are skipped.'
          : 'No low-stock or expiry alerts right now.',
    })
  }

  const trend: TrendPoint[] = trendRows.map((row) => {
    const monthRevenue = n(row.revenue)
    const monthExpenses = n(row.expenses)
    return {
      month: row.month,
      revenue: monthRevenue,
      expenses: monthExpenses,
      profit: monthRevenue - monthExpenses,
    }
  })

  const topItems: TopItem[] = topItemRows.map((row) => ({
    itemCode: row.item_code,
    itemName: row.item_name,
    quantity: n(row.quantity),
    revenue: n(row.revenue),
    customers: n(row.customers),
  }))

  const salesByCustomer: CustomerSale[] = customerRows.map((row) => ({
    partyName: row.party_name,
    revenue: n(row.revenue),
    invoices: n(row.invoices),
  }))

  return {
    today: {
      salesTotal: n(sales?.total),
      salesCount: n(sales?.count),
      purchasesTotal: n(purchases?.total),
      purchasesCount: n(purchases?.count),
    },
    balances: {
      cash,
      bank,
      inventory,
      total: cash + bank + inventory,
      receivable: n(balances?.receivable),
      payable: n(balances?.payable),
    },
    profitLoss: {
      revenue,
      expenses,
      profit: revenue - expenses,
      isProfit: revenue >= expenses,
    },
    recentTransactions: recentRows.map((row) => ({
      reference: row.reference,
      date: row.date,
      type: row.type,
      amount: n(row.amount),
      partyName: row.partyName,
    })),
    inventory: {
      totalItems: n(itemCountRows[0]?.count),
      lowStockCount: lowStockItems.length,
      lowStockItems,
      minimumConfigured,
      expiringCount: expiringItems.length,
      expiringItems,
    },
    alerts,
    monthlyTrend: trend,
    topItems,
    salesByCustomer,
  }
}
