/**
 * Demo data mode. When VITE_DEMO_MODE=1, query() routes here instead of the
 * network, letting the UI run (and the Pages site demo) without credentials.
 * Matchers key off the static SQL strings in lib/queries — those queries never
 * change shape silently, and a miss simply yields an empty result.
 */
import type { Row } from './types'

/** Demo rows allow undefined so array-index access stays ergonomic. */
type DRow = Record<string, string | number | null | undefined>

const days = (n: number): string[] => {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

const trendDays = days(14)

const trend: Row[] = trendDays.map((d, i) => ({
  d,
  total:
    (i % 3 === 0 ? 210_000 : i % 3 === 1 ? 96_500 : 158_200) + i * 3_100,
}))

const purchaseTrend: Row[] = trendDays.map((d, i) => ({
  d,
  total: (i % 2 === 0 ? 74_000 : 132_800) - i * 900,
}))

const partyRows: Row[] = [
  { id: 1, code: 'C-001', name: 'Emzor Pharma', party_type: 'CUSTOMER' },
  { id: 2, code: 'C-002', name: 'HealthPlus Ltd', party_type: 'CUSTOMER' },
  { id: 3, code: 'C-003', name: 'Medplus Nigeria', party_type: 'CUSTOMER' },
  { id: 4, code: 'S-001', name: 'Vitamin Raw Supplies', party_type: 'SUPPLIER' },
  { id: 5, code: 'S-002', name: 'PackCo Industries', party_type: 'SUPPLIER' },
  { id: 6, code: 'B-001', name: 'Dual Distribution', party_type: 'BOTH' },
]

const partySummary: Row[] = [
  { id: 1, code: 'C-001', name: 'Emzor Pharma', party_type: 'CUSTOMER', debit: 820_000, credit: 210_000 },
  { id: 2, code: 'C-002', name: 'HealthPlus Ltd', party_type: 'CUSTOMER', debit: 540_000, credit: 300_000 },
  { id: 3, code: 'C-003', name: 'Medplus Nigeria', party_type: 'CUSTOMER', debit: 390_000, credit: 390_500 },
  { id: 4, code: 'S-001', name: 'Vitamin Raw Supplies', party_type: 'SUPPLIER', debit: 150_000, credit: 640_000 },
  { id: 5, code: 'S-002', name: 'PackCo Industries', party_type: 'SUPPLIER', debit: 90_000, credit: 310_000 },
  { id: 6, code: 'B-001', name: 'Dual Distribution', party_type: 'BOTH', debit: 260_000, credit: 240_000 },
]

const ledgerEntries: Row[] = [
  { entry_date: '2026-09-02', voucher_number: 'JV-0114', voucher_type: 'SALES', description: 'Invoice JV-0114', debit: 420_000, credit: 0, account_code: '1100', account_name: 'Accounts Receivable' },
  { entry_date: '2026-09-11', voucher_number: 'JV-0121', voucher_type: 'RECEIPT', description: 'Bank transfer received', debit: 0, credit: 300_000, account_code: '1010', account_name: 'Bank' },
  { entry_date: '2026-09-19', voucher_number: 'JV-0130', voucher_type: 'SALES', description: 'Invoice JV-0130', debit: 265_000, credit: 0, account_code: '1100', account_name: 'Accounts Receivable' },
  { entry_date: '2026-09-28', voucher_number: 'JV-0142', voucher_type: 'RECEIPT', description: 'Cash payment', debit: 0, credit: 150_000, account_code: '1000', account_name: 'Cash' },
]

const stockRows: Row[] = [
  { item_code: 'VIT-C-500', item_name: 'Vitamin C 500mg Tablets', unit: 'bottle', total_stock: 1240, minimum_stock: 200, total_value: 3_720_000, batch_count: 4 },
  { item_code: 'MULTI-D', item_name: 'Multivitamin Daily Capsules', unit: 'bottle', total_stock: 86, minimum_stock: 150, total_value: 404_200, batch_count: 2 },
  { item_code: 'OMEGA3-SF', item_name: 'Omega-3 Softgels', unit: 'bottle', total_stock: 415, minimum_stock: 100, total_value: 1_658_500, batch_count: 3 },
  { item_code: 'ZINC-50', item_name: 'Zinc 50mg Tablets', unit: 'bottle', total_stock: 42, minimum_stock: 120, total_value: 113_400, batch_count: 1 },
  { item_code: 'PROB-30', item_name: 'Probiotic 30 Capsules', unit: 'box', total_stock: 268, minimum_stock: 80, total_value: 1_822_400, batch_count: 3 },
  { item_code: 'CAL-MAG', item_name: 'Calcium + Magnesium', unit: 'bottle', total_stock: 511, minimum_stock: 100, total_value: 1_275_000, batch_count: 2 },
]

const salesInvoices: Row[] = [
  { invoice_number: 'SI-1042', customer_name: 'Emzor Pharma', invoice_date: trendDays[13]!, total_amount: 420_000, paid_amount: 420_000, status: 'PAID' },
  { invoice_number: 'SI-1041', customer_name: 'HealthPlus Ltd', invoice_date: trendDays[12]!, total_amount: 265_000, paid_amount: 100_000, status: 'PARTIAL' },
  { invoice_number: 'SI-1040', customer_name: 'Medplus Nigeria', invoice_date: trendDays[10]!, total_amount: 158_200, paid_amount: 0, status: 'PENDING' },
  { invoice_number: 'SI-1039', customer_name: 'Emzor Pharma', invoice_date: trendDays[8]!, total_amount: 96_500, paid_amount: 96_500, status: 'PAID' },
  { invoice_number: 'SI-1038', customer_name: 'HealthPlus Ltd', invoice_date: trendDays[6]!, total_amount: 210_000, paid_amount: 210_000, status: 'COMPLETED' },
]

const purchaseInvoices: Row[] = [
  { invoice_number: 'PI-0388', supplier_name: 'Vitamin Raw Supplies', invoice_date: trendDays[13]!, total_amount: 132_800, paid_amount: 132_800, status: 'PAID' },
  { invoice_number: 'PI-0387', supplier_name: 'PackCo Industries', invoice_date: trendDays[11]!, total_amount: 74_000, paid_amount: 40_000, status: 'PARTIAL' },
  { invoice_number: 'PI-0386', supplier_name: 'Vitamin Raw Supplies', invoice_date: trendDays[7]!, total_amount: 96_400, paid_amount: 0, status: 'PENDING' },
  { invoice_number: 'PI-0385', supplier_name: 'PackCo Industries', invoice_date: trendDays[4]!, total_amount: 58_900, paid_amount: 58_900, status: 'PAID' },
]

const trialBalance: Row[] = [
  { code: '1000', name: 'Cash', account_type: 'ASSET', odr: 0, ocr: 0, total_debit: 1_284_500, total_credit: 0 },
  { code: '1010', name: 'Bank', odr: 0, ocr: 0, account_type: 'ASSET', total_debit: 3_920_000, total_credit: 0 },
  { code: '1100', name: 'Accounts Receivable', odr: 0, ocr: 0, account_type: 'ASSET', total_debit: 1_239_500, total_credit: 0 },
  { code: '1200', name: 'Raw Materials Inventory', odr: 0, ocr: 0, account_type: 'ASSET', total_debit: 940_300, total_credit: 0 },
  { code: '1220', name: 'Finished Goods Inventory', odr: 0, ocr: 0, account_type: 'ASSET', total_debit: 1_470_000, total_credit: 0 },
  { code: '2000', name: 'Accounts Payable', odr: 0, ocr: 0, account_type: 'LIABILITY', total_debit: 0, total_credit: 860_000 },
  { code: '2100', name: 'Sales Tax Payable', odr: 0, ocr: 0, account_type: 'LIABILITY', total_debit: 0, total_credit: 94_300 },
  { code: '4000', name: 'Sales Revenue', odr: 0, ocr: 0, account_type: 'REVENUE', total_debit: 0, total_credit: 8_450_000 },
  { code: '5000', name: 'Cost of Goods Sold', odr: 0, ocr: 0, account_type: 'EXPENSE', total_debit: 5_290_000, total_credit: 0 },
  { code: '5100', name: 'Operating Expenses', odr: 0, ocr: 0, account_type: 'EXPENSE', total_debit: 1_260_000, total_credit: 0 },
]

const plRevenue: Row[] = [
  { code: '4000', name: 'Sales Revenue', amount: 2_450_000 },
  { code: '4010', name: 'Wholesale Revenue', amount: 890_000 },
]

const plExpenses: Row[] = [
  { code: '5000', name: 'Cost of Goods Sold', amount: 1_510_000 },
  { code: '5100', name: 'Salaries & Wages', amount: 320_000 },
  { code: '5200', name: 'Packaging Materials', amount: 96_400 },
  { code: '5300', name: 'Logistics', amount: 58_900 },
]

const balanceSheet: { assets: Row[]; liabilities: Row[]; equity: Row[] } = {
  assets: [
    { code: '1000', name: 'Cash', amount: 1_284_500 },
    { code: '1010', name: 'Bank', amount: 3_920_000 },
    { code: '1100', name: 'Accounts Receivable', amount: 1_239_500 },
    { code: '1200', name: 'Raw Materials Inventory', amount: 940_300 },
    { code: '1220', name: 'Finished Goods Inventory', amount: 1_470_000 },
  ],
  liabilities: [
    { code: '2000', name: 'Accounts Payable', amount: 860_000 },
    { code: '2100', name: 'Sales Tax Payable', amount: 94_300 },
  ],
  equity: [
    { code: '3000', name: 'Retained Earnings', amount: 7_900_000 },
  ],
}

const cashBook: DRow[] = [
  { voucher_number: 'JV-0121', entry_date: '2026-09-11', description: 'Bank transfer received', account_name: 'Bank', debit: 300_000, credit: 0 },
  { voucher_number: 'JV-0125', entry_date: '2026-09-15', description: 'Raw materials purchase', account_name: 'Bank', debit: 0, credit: 132_800 },
  { voucher_number: 'JV-0142', entry_date: '2026-09-28', description: 'Cash payment', account_name: 'Cash', debit: 0, credit: 150_000 },
  { voucher_number: 'JV-0148', entry_date: '2026-10-02', description: 'Cash sale deposit', account_name: 'Cash', debit: 96_500, credit: 0 },
]


/** Return demo rows for a known query shape, or [] for unknown SQL. */
export function demoQuery<T>(sql: string): T[] {
  // Order matters: more specific patterns must come first (LIMIT 5 vs LIMIT 50).
  const candidates: [RegExp, DRow[]][] = [
    [/from sales_invoices[\s\S]*group by d/i, trend],
    [/from purchase_invoices[\s\S]*group by d/i, purchaseTrend],
    [/from sales_invoices[\s\S]*limit 5$/i, salesInvoices.slice(0, 3)],
    [/from purchase_invoices[\s\S]*limit 5$/i, purchaseInvoices.slice(0, 3)],
    [/from sales_invoices[\s\S]*limit 50/i, salesInvoices],
    [/from purchase_invoices[\s\S]*limit 50/i, purchaseInvoices],
    [/count\(\*\) as count[\s\S]*from sales_invoices/i, [{ total: 210_000, count: 3 }]],
    [/count\(\*\) as count[\s\S]*from purchase_invoices/i, [{ total: 74_000, count: 1 }]],
    [/account_code = '1000'/i, [{ balance: 1_284_500 }]],
    [/account_code = '1010'/i, [{ balance: 3_920_000 }]],
    [/account_type = 'REVENUE'[\s\S]*entry_date >=/i, plRevenue],
    [/account_type = 'REVENUE'/i, [{ total: 8_450_000 }]],
    [/account_type = 'EXPENSE'[\s\S]*entry_date >=/i, plExpenses],
    [/account_type = 'ASSET'/i, balanceSheet.assets],
    [/account_type = 'LIABILITY'/i, balanceSheet.liabilities],
    [/account_type = 'EQUITY'/i, balanceSheet.equity],
    [/having total_debit/i, trialBalance],
    [/from stock_batches where is_active = 1$/i, [{ value: 2_410_300 }]],
    [/group by i\.id[\s\S]*order by total_stock/i, stockRows],
    [/count\(\*\) as count from items/i, [{ count: 128 }]],
    [/count\(\*\) as count from parties/i, [{ count: 42 }]],
    [/from parties p\s*join journal_entry_lines/i, partySummary],
    [/from parties where is_active = 1 order by name/i, partyRows],
    [/from parties where id =/i, [partyRows[0]!]],
    [/jel\.party_id[\s\S]*voucher_type = 'opening'/i, [{ ob: 1_530_000 }]],
    [/jel\.party_id[\s\S]*order by je\.entry_date/i, ledgerEntries],
    [/account_code in \('1000', '1010'\)/i, cashBook],
  ]

  for (const [pattern, rows] of candidates) {
    if (pattern.test(sql)) return rows as T[]
  }
  return []
}
