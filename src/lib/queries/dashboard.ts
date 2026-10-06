/**
 * Dashboard SQL, ported from the original docs/index.html contract and
 * aligned with the desktop ERP's report conventions:
 *  - revenue view excludes OPENING vouchers (period-side convention);
 *  - balances are journal-derived (accounts.opening_balance is legacy).
 */
import { query } from '../sqlitecloud'
import type { DashboardData, RecentTransaction, SalesTrendPoint } from '../types'
import { daysBackISO, todayISO } from '../format'

const sum = 'COALESCE(SUM(%s), 0)'

export async function fetchDashboard(): Promise<DashboardData> {
  const today = todayISO()

  const [salesToday, purchasesToday, cash, bank, revenue, inventory, items, parties, recentSales, recentPurchases] =
    await Promise.all([
      query<{ total: number; count: number }>(
        `SELECT ${sum.replace('%s', 'total_amount')} AS total, COUNT(*) AS count
         FROM sales_invoices
         WHERE date(invoice_date) = date('${today}') AND status != 'CANCELLED'`,
      ),
      query<{ total: number; count: number }>(
        `SELECT ${sum.replace('%s', 'total_amount')} AS total, COUNT(*) AS count
         FROM purchase_invoices
         WHERE date(invoice_date) = date('${today}') AND status != 'CANCELLED'`,
      ),
      query<{ balance: number }>(
        `SELECT ${sum.replace('%s', 'jel.debit - jel.credit')} AS balance
         FROM journal_entry_lines jel
         JOIN journal_entries je ON je.id = jel.journal_entry_id
         JOIN accounts a ON a.id = jel.account_id
         WHERE a.account_code = '1000' AND je.is_posted = 1`,
      ),
      query<{ balance: number }>(
        `SELECT ${sum.replace('%s', 'jel.debit - jel.credit')} AS balance
         FROM journal_entry_lines jel
         JOIN journal_entries je ON je.id = jel.journal_entry_id
         JOIN accounts a ON a.id = jel.account_id
         WHERE a.account_code = '1010' AND je.is_posted = 1`,
      ),
      query<{ total: number }>(
        `SELECT ${sum.replace('%s', 'jel.credit')} AS total
         FROM journal_entry_lines jel
         JOIN journal_entries je ON je.id = jel.journal_entry_id
         JOIN accounts a ON a.id = jel.account_id
         WHERE a.account_type = 'REVENUE' AND je.is_posted = 1
           AND je.voucher_type != 'OPENING'`,
      ),
      query<{ value: number }>(
        `SELECT ${sum.replace('%s', 'quantity_in_stock * purchase_price')} AS value
         FROM stock_batches WHERE is_active = 1`,
      ),
      query<{ count: number }>(`SELECT COUNT(*) AS count FROM items WHERE is_active = 1`),
      query<{ count: number }>(`SELECT COUNT(*) AS count FROM parties WHERE is_active = 1`),
      query<RecentTransaction>(
        `SELECT invoice_number AS reference, invoice_date AS date,
                'Sales' AS type, total_amount AS amount
         FROM sales_invoices WHERE status != 'CANCELLED'
         ORDER BY invoice_date DESC LIMIT 5`,
      ),
      query<RecentTransaction>(
        `SELECT invoice_number AS reference, invoice_date AS date,
                'Purchase' AS type, total_amount AS amount
         FROM purchase_invoices WHERE status != 'CANCELLED'
         ORDER BY invoice_date DESC LIMIT 5`,
      ),
    ])

  const recent = [...recentSales, ...recentPurchases]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 10)

  return {
    todaySales: salesToday[0] ?? { total: 0, count: 0 },
    todayPurchases: purchasesToday[0] ?? { total: 0, count: 0 },
    cash: cash[0]?.balance ?? 0,
    bank: bank[0]?.balance ?? 0,
    inventoryValue: inventory[0]?.value ?? 0,
    revenue: revenue[0]?.total ?? 0,
    totalItems: items[0]?.count ?? 0,
    totalParties: parties[0]?.count ?? 0,
    recent,
  }
}

/** Daily sales vs purchases over the trailing N days (chart series). */
export async function fetchSalesTrend(days = 14): Promise<SalesTrendPoint[]> {
  const from = daysBackISO(days - 1)

  const [sales, purchases] = await Promise.all([
    query<{ d: string; total: number }>(
      `SELECT date(invoice_date) AS d, COALESCE(SUM(total_amount), 0) AS total
       FROM sales_invoices
       WHERE date(invoice_date) >= date('${from}') AND status != 'CANCELLED'
       GROUP BY d ORDER BY d`,
    ),
    query<{ d: string; total: number }>(
      `SELECT date(invoice_date) AS d, COALESCE(SUM(total_amount), 0) AS total
       FROM purchase_invoices
       WHERE date(invoice_date) >= date('${from}') AND status != 'CANCELLED'
       GROUP BY d ORDER BY d`,
    ),
  ])

  const salesByDay = new Map(sales.map((r) => [r.d, r.total]))
  const purchasesByDay = new Map(purchases.map((r) => [r.d, r.total]))
  const allDays = [...new Set([...salesByDay.keys(), ...purchasesByDay.keys()])].sort()

  return allDays.map((d) => ({
    date: d,
    sales: salesByDay.get(d) ?? 0,
    purchases: purchasesByDay.get(d) ?? 0,
  }))
}
