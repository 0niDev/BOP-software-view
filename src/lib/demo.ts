/**
 * Demo data mode. When VITE_DEMO_MODE=1, query() routes here instead of the
 * network, letting the UI run (and the Pages demo) without credentials.
 *
 * Matchers key off the static SQL fragments in lib/queries. A miss yields an
 * empty result, so new queries degrade to an empty state rather than crashing.
 */
/** Demo rows allow undefined so array-index access stays ergonomic. */
type DRow = Record<string, string | number | null | undefined>

const iso = (date: Date): string => date.toISOString().slice(0, 10)

const today = iso(new Date())

const daysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return iso(date)
}

const monthStarts = Array.from({ length: 6 }, (_, index) => {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - (5 - index))
  return iso(date)
})

const sqlId = (sql: string): number | null => {
  const match = /(?:where|and)\s+(?:si|pi|u|p)?\.?id\s*=\s*(\d+)/i.exec(sql)
  return match ? Number(match[1]) : null
}

const companies: DRow[] = [
  {
    name: 'BOP Nutraceuticals (Demo)',
    address: 'Plot 42, Industrial Estate, Lahore',
    phone: '+92 42 111 267 267',
    email: 'accounts@bop.example',
    ntn: '1234567-8',
  },
]

const recent: DRow[] = [
  { reference: 'SI-1042', date: today, type: 'Sales', amount: 420_000, partyName: 'Emzor Pharma' },
  { reference: 'PI-0388', date: today, type: 'Purchases', amount: 132_800, partyName: 'Vitamin Raw Supplies' },
  { reference: 'RV-0218', date: daysAgo(2), type: 'Receipt', amount: 300_000, partyName: 'HealthPlus Ltd' },
  { reference: 'SI-1041', date: daysAgo(3), type: 'Sales', amount: 265_000, partyName: 'HealthPlus Ltd' },
  { reference: 'PV-0142', date: daysAgo(6), type: 'Payment', amount: 150_000, partyName: 'PackCo Industries' },
  { reference: 'EX-0087', date: daysAgo(8), type: 'Expense', amount: 58_900, partyName: 'Logistics' },
]

const lowStock: DRow[] = [
  { item_code: 'MULTI-D', item_name: 'Multivitamin Daily Capsules', unit: 'BOTTLE', current_stock: 86, minimum_stock: 150 },
  { item_code: 'ZINC-50', item_name: 'Zinc 50mg Tablets', unit: 'BOTTLE', current_stock: 42, minimum_stock: 120 },
]

const expiring: DRow[] = [
  { item_code: 'PROB-30', item_name: 'Probiotic 30 Capsules', unit: 'BOX', batch_number: 'B-PRB-2601', expiry_date: daysAgo(-18), quantity_in_stock: 64 },
  { item_code: 'VIT-C-500', item_name: 'Vitamin C 500mg Tablets', unit: 'BOTTLE', batch_number: 'B-VTC-2604', expiry_date: daysAgo(-27), quantity_in_stock: 120 },
]

const trend: DRow[] = monthStarts.map((month, index) => ({
  month,
  revenue: [1_820_000, 2_100_000, 2_380_000, 1_980_000, 2_610_000, 2_450_000][index] ?? 0,
  expenses: [1_310_000, 1_440_000, 1_620_000, 1_390_000, 1_700_000, 1_510_000][index] ?? 0,
}))

const topItems: DRow[] = [
  { item_code: 'VIT-C-500', item_name: 'Vitamin C 500mg Tablets', quantity: 1_240, revenue: 1_984_000, customers: 4 },
  { item_code: 'OMEGA3-SF', item_name: 'Omega-3 Softgels', quantity: 415, revenue: 1_245_000, customers: 3 },
  { item_code: 'PROB-30', item_name: 'Probiotic 30 Capsules', quantity: 268, revenue: 938_000, customers: 3 },
  { item_code: 'CAL-MAG', item_name: 'Calcium + Magnesium', quantity: 511, revenue: 766_500, customers: 2 },
  { item_code: 'MULTI-D', item_name: 'Multivitamin Daily Capsules', quantity: 322, revenue: 644_000, customers: 2 },
]

const customers: DRow[] = [
  { party_name: 'Emzor Pharma', revenue: 1_820_000, invoices: 6 },
  { party_name: 'HealthPlus Ltd', revenue: 1_460_000, invoices: 5 },
  { party_name: 'Medplus Nigeria', revenue: 980_000, invoices: 4 },
]

const salesInvoices: DRow[] = [
  { id: 1, invoiceNumber: 'SI-1042', partyCode: 'C-001', partyName: 'Emzor Pharma', date: today, paymentType: 'CREDIT', subtotal: 400_000, discountAmount: 0, taxAmount: 20_000, totalAmount: 420_000, paidAmount: 420_000, status: 'PAID', warehouse: 'Main Store', notes: null },
  { id: 2, invoiceNumber: 'SI-1041', partyCode: 'C-002', partyName: 'HealthPlus Ltd', date: daysAgo(3), paymentType: 'CREDIT', subtotal: 250_000, discountAmount: 0, taxAmount: 15_000, totalAmount: 265_000, paidAmount: 100_000, status: 'PARTIAL', warehouse: 'Main Store', notes: 'Balance due on delivery.' },
  { id: 3, invoiceNumber: 'SI-1040', partyCode: 'C-003', partyName: 'Medplus Nigeria', date: daysAgo(7), paymentType: 'CASH', subtotal: 150_000, discountAmount: 0, taxAmount: 8_200, totalAmount: 158_200, paidAmount: 0, status: 'PENDING', warehouse: 'Main Store', notes: null },
  { id: 4, invoiceNumber: 'SI-1039', partyCode: 'C-001', partyName: 'Emzor Pharma', date: daysAgo(11), paymentType: 'BANK', subtotal: 92_000, discountAmount: 0, taxAmount: 4_500, totalAmount: 96_500, paidAmount: 96_500, status: 'PAID', warehouse: 'Main Store', notes: null },
  { id: 5, invoiceNumber: 'SI-1038', partyCode: 'C-002', partyName: 'HealthPlus Ltd', date: daysAgo(16), paymentType: 'CREDIT', subtotal: 200_000, discountAmount: 0, taxAmount: 10_000, totalAmount: 210_000, paidAmount: 210_000, status: 'PAID', warehouse: 'Main Store', notes: null },
]

const purchaseInvoices: DRow[] = [
  { id: 11, invoiceNumber: 'PI-0388', partyCode: 'S-001', partyName: 'Vitamin Raw Supplies', date: today, paymentType: 'CREDIT', subtotal: 128_000, discountAmount: 0, taxAmount: 4_800, totalAmount: 132_800, paidAmount: 132_800, status: 'PAID', warehouse: 'Raw Store', notes: null },
  { id: 12, invoiceNumber: 'PI-0387', partyCode: 'S-002', partyName: 'PackCo Industries', date: daysAgo(4), paymentType: 'CREDIT', subtotal: 70_000, discountAmount: 0, taxAmount: 4_000, totalAmount: 74_000, paidAmount: 40_000, status: 'PARTIAL', warehouse: 'Packaging Store', notes: null },
  { id: 13, invoiceNumber: 'PI-0386', partyCode: 'S-001', partyName: 'Vitamin Raw Supplies', date: daysAgo(9), paymentType: 'CREDIT', subtotal: 92_000, discountAmount: 0, taxAmount: 4_400, totalAmount: 96_400, paidAmount: 0, status: 'PENDING', warehouse: 'Raw Store', notes: null },
  { id: 14, invoiceNumber: 'PI-0385', partyCode: 'S-002', partyName: 'PackCo Industries', date: daysAgo(13), paymentType: 'BANK', subtotal: 55_000, discountAmount: 0, taxAmount: 3_900, totalAmount: 58_900, paidAmount: 58_900, status: 'PAID', warehouse: 'Packaging Store', notes: null },
]

const salesItems: DRow[] = [
  { id: 1, itemCode: 'VIT-C-500', itemName: 'Vitamin C 500mg Tablets', unit: 'BOTTLE', quantity: 240, unitPrice: 1_200, discountAmount: 0, taxAmount: 12_000, lineTotal: 300_000, batchNumber: 'B-VTC-2602', expiryDate: daysAgo(-320) },
  { id: 2, itemCode: 'OMEGA3-SF', itemName: 'Omega-3 Softgels', unit: 'BOTTLE', quantity: 80, unitPrice: 1_500, discountAmount: 0, taxAmount: 8_000, lineTotal: 128_000, batchNumber: 'B-OMG-2601', expiryDate: daysAgo(-280) },
]

const purchaseItems: DRow[] = [
  { id: 11, itemCode: 'VIT-C-RAW', itemName: 'Vitamin C API', unit: 'KG', quantity: 40, unitPrice: 3_200, discountAmount: 0, taxAmount: 4_800, lineTotal: 132_800, batchNumber: 'RM-VTC-2608', expiryDate: daysAgo(-400) },
  { id: 12, itemCode: 'PACK-BTL-100', itemName: 'Bottle 100ml', unit: 'UNIT', quantity: 2_000, unitPrice: 35, discountAmount: 0, taxAmount: 4_000, lineTotal: 74_000, batchNumber: null, expiryDate: null },
]

const partySummary: DRow[] = [
  { id: 1, code: 'C-001', name: 'Emzor Pharma', partyType: 'CUSTOMER', phone: '+92 300 111 2233', debit: 820_000, credit: 210_000 },
  { id: 2, code: 'C-002', name: 'HealthPlus Ltd', partyType: 'CUSTOMER', phone: '+92 300 222 3344', debit: 540_000, credit: 300_000 },
  { id: 3, code: 'C-003', name: 'Medplus Nigeria', partyType: 'CUSTOMER', phone: '+92 300 333 4455', debit: 390_000, credit: 390_500 },
  { id: 4, code: 'S-001', name: 'Vitamin Raw Supplies', partyType: 'SUPPLIER', phone: '+92 300 444 5566', debit: 150_000, credit: 640_000 },
  { id: 5, code: 'S-002', name: 'PackCo Industries', partyType: 'SUPPLIER', phone: '+92 300 555 6677', debit: 90_000, credit: 310_000 },
  { id: 6, code: 'B-001', name: 'Dual Distribution', partyType: 'BOTH', phone: '+92 300 666 7788', debit: 260_000, credit: 240_000 },
]

const ledgerEntries: DRow[] = [
  { entry_date: daysAgo(20), voucher_number: 'SI-1042', voucher_type: 'SALES', description: 'Sales invoice SI-1042', debit: 420_000, credit: 0, account_code: '1100', account_name: 'Accounts Receivable' },
  { entry_date: daysAgo(14), voucher_number: 'RV-0218', voucher_type: 'RECEIPT', description: 'Bank transfer received', debit: 0, credit: 300_000, account_code: '1010', account_name: 'Bank' },
  { entry_date: daysAgo(8), voucher_number: 'SI-1039', voucher_type: 'SALES', description: 'Sales invoice SI-1039', debit: 96_500, credit: 0, account_code: '1100', account_name: 'Accounts Receivable' },
  { entry_date: daysAgo(3), voucher_number: 'RV-0221', voucher_type: 'RECEIPT', description: 'Cash payment received', debit: 0, credit: 150_000, account_code: '1000', account_name: 'Cash in Hand' },
]

const items: DRow[] = [
  { id: 1, item_code: 'VIT-C-500', item_name: 'Vitamin C 500mg Tablets', item_type: 'FINISHED_GOOD', unit: 'BOTTLE', category: 'Vitamins', minimum_stock: 200, purchase_price: 640, selling_price: 1_200, stock: 1_240, stock_value: 793_600, batch_count: 4, nearest_expiry: daysAgo(-320), is_active: 1 },
  { id: 2, item_code: 'MULTI-D', item_name: 'Multivitamin Daily Capsules', item_type: 'FINISHED_GOOD', unit: 'BOTTLE', category: 'Vitamins', minimum_stock: 150, purchase_price: 720, selling_price: 1_350, stock: 86, stock_value: 61_920, batch_count: 2, nearest_expiry: daysAgo(-210), is_active: 1 },
  { id: 3, item_code: 'OMEGA3-SF', item_name: 'Omega-3 Softgels', item_type: 'FINISHED_GOOD', unit: 'BOTTLE', category: 'Cardio', minimum_stock: 100, purchase_price: 980, selling_price: 1_850, stock: 415, stock_value: 406_700, batch_count: 3, nearest_expiry: daysAgo(-280), is_active: 1 },
  { id: 4, item_code: 'ZINC-50', item_name: 'Zinc 50mg Tablets', item_type: 'FINISHED_GOOD', unit: 'BOTTLE', category: 'Minerals', minimum_stock: 120, purchase_price: 410, selling_price: 780, stock: 42, stock_value: 17_220, batch_count: 1, nearest_expiry: daysAgo(-190), is_active: 1 },
  { id: 5, item_code: 'PROB-30', item_name: 'Probiotic 30 Capsules', item_type: 'FINISHED_GOOD', unit: 'BOX', category: 'Digestive', minimum_stock: 80, purchase_price: 1_150, selling_price: 2_100, stock: 268, stock_value: 308_200, batch_count: 3, nearest_expiry: daysAgo(-18), is_active: 1 },
  { id: 6, item_code: 'CAL-MAG', item_name: 'Calcium + Magnesium', item_type: 'FINISHED_GOOD', unit: 'BOTTLE', category: 'Minerals', minimum_stock: 100, purchase_price: 690, selling_price: 1_250, stock: 511, stock_value: 352_590, batch_count: 2, nearest_expiry: daysAgo(-240), is_active: 1 },
  { id: 7, item_code: 'VIT-C-RAW', item_name: 'Vitamin C API', item_type: 'RAW_MATERIAL', unit: 'KG', category: 'API', minimum_stock: 50, purchase_price: 3_200, selling_price: 0, stock: 180, stock_value: 576_000, batch_count: 3, nearest_expiry: daysAgo(-400), is_active: 1 },
  { id: 8, item_code: 'PACK-BTL-100', item_name: 'Bottle 100ml', item_type: 'PACKAGING', unit: 'UNIT', category: 'Packaging', minimum_stock: 500, purchase_price: 35, selling_price: 0, stock: 2_400, stock_value: 84_000, batch_count: 1, nearest_expiry: null, is_active: 1 },
]

const trialBalance: DRow[] = [
  { code: '1000', name: 'Cash in Hand', accountType: 'ASSET', odr: 0, ocr: 0, totalDebit: 1_284_500, totalCredit: 0 },
  { code: '1010', name: 'Bank', accountType: 'ASSET', odr: 0, ocr: 0, totalDebit: 3_920_000, totalCredit: 0 },
  { code: '1100', name: 'Accounts Receivable', accountType: 'ASSET', odr: 0, ocr: 0, totalDebit: 1_239_500, totalCredit: 0 },
  { code: '1200', name: 'Raw Materials Inventory', accountType: 'ASSET', odr: 0, ocr: 0, totalDebit: 940_300, totalCredit: 0 },
  { code: '1220', name: 'Finished Goods Inventory', accountType: 'ASSET', odr: 0, ocr: 0, totalDebit: 1_470_000, totalCredit: 0 },
  { code: '2000', name: 'Accounts Payable', accountType: 'LIABILITY', odr: 0, ocr: 0, totalDebit: 0, totalCredit: 860_000 },
  { code: '2100', name: 'Sales Tax Payable', accountType: 'LIABILITY', odr: 0, ocr: 0, totalDebit: 0, totalCredit: 94_300 },
  { code: '3000', name: 'Retained Earnings', accountType: 'EQUITY', odr: 0, ocr: 6_000_000, totalDebit: 0, totalCredit: 6_000_000 },
  { code: '4000', name: 'Sales Revenue', accountType: 'REVENUE', odr: 0, ocr: 0, totalDebit: 0, totalCredit: 8_450_000 },
  { code: '5000', name: 'Cost of Goods Sold', accountType: 'EXPENSE', odr: 0, ocr: 0, totalDebit: 5_290_000, totalCredit: 0 },
  { code: '5100', name: 'Operating Expenses', accountType: 'EXPENSE', odr: 0, ocr: 0, totalDebit: 1_260_000, totalCredit: 0 },
]

const plRevenue: DRow[] = [
  { code: '4000', name: 'Sales Revenue', amount: 2_450_000 },
  { code: '4010', name: 'Wholesale Revenue', amount: 890_000 },
]

const plExpenses: DRow[] = [
  { code: '5000', name: 'Cost of Goods Sold', amount: 1_510_000 },
  { code: '5100', name: 'Salaries & Wages', amount: 320_000 },
  { code: '5200', name: 'Packaging Materials', amount: 96_400 },
  { code: '5300', name: 'Logistics', amount: 58_900 },
]

const balanceSheet = {
  assets: [
    { code: '1000', name: 'Cash in Hand', amount: 1_284_500 },
    { code: '1010', name: 'Bank', amount: 3_920_000 },
    { code: '1100', name: 'Accounts Receivable', amount: 1_239_500 },
    { code: '1200', name: 'Raw Materials Inventory', amount: 940_300 },
    { code: '1220', name: 'Finished Goods Inventory', amount: 1_470_000 },
  ] as DRow[],
  liabilities: [
    { code: '2000', name: 'Accounts Payable', amount: 860_000 },
    { code: '2100', name: 'Sales Tax Payable', amount: 94_300 },
  ] as DRow[],
  equity: [{ code: '3000', name: 'Retained Earnings', amount: 7_900_000 }] as DRow[],
}

const cashBook: DRow[] = [
  { voucherNumber: 'RV-0218', date: daysAgo(14), description: 'Bank transfer received', accountName: 'Bank', debit: 300_000, credit: 0 },
  { voucherNumber: 'PV-0142', date: daysAgo(10), description: 'Raw materials purchase', accountName: 'Bank', debit: 0, credit: 132_800 },
  { voucherNumber: 'PV-0146', date: daysAgo(6), description: 'Cash payment', accountName: 'Cash in Hand', debit: 0, credit: 150_000 },
  { voucherNumber: 'RV-0221', date: daysAgo(2), description: 'Cash sale deposit', accountName: 'Cash in Hand', debit: 96_500, credit: 0 },
]

const users: DRow[] = [
  { id: 1, username: 'admin', fullName: 'System Administrator', email: 'admin@bop.example', role: 'Admin', isActive: 1, lastLoginAt: `${today} 09:42:00`, createdAt: '2024-01-04 10:00:00' },
  { id: 2, username: 'accounts', fullName: 'Ayesha Khan', email: 'ayesha@bop.example', role: 'Accountant', isActive: 1, lastLoginAt: daysAgo(1) + ' 17:10:00', createdAt: '2024-06-18 11:20:00' },
  { id: 3, username: 'store', fullName: 'Bilal Ahmed', email: 'bilal@bop.example', role: 'Storekeeper', isActive: 1, lastLoginAt: daysAgo(4) + ' 08:05:00', createdAt: '2024-09-02 09:15:00' },
]

const roles: DRow[] = [
  { id: 1, name: 'Accountant', description: 'Sales, purchases, banking and reports' },
  { id: 2, name: 'Admin', description: 'Full system administration' },
  { id: 3, name: 'Manager', description: 'Executive dashboards and approvals' },
  { id: 4, name: 'Production Manager', description: 'Manufacturing and bills of materials' },
  { id: 5, name: 'Storekeeper', description: 'Inventory, batches and warehouses' },
]

const roleGrants: DRow[] = [
  { roleId: 1, code: 'sales.view', description: 'View sales' },
  { roleId: 1, code: 'purchases.view', description: 'View purchases' },
  { roleId: 1, code: 'reports.view', description: 'View reports' },
  { roleId: 2, code: 'admin.users', description: 'Manage users' },
  { roleId: 2, code: 'admin.settings', description: 'Manage settings' },
  { roleId: 2, code: 'sales.view', description: 'View sales' },
  { roleId: 3, code: 'dashboard.view', description: 'View dashboard' },
  { roleId: 5, code: 'items.view', description: 'View items' },
]

const settings: DRow[] = [
  { group: 'APPEARANCE', key: 'theme_name', value: 'dark' },
  { group: 'GENERAL', key: 'company_name', value: 'BOP Nutraceuticals' },
  { group: 'GENERAL', key: 'date_format', value: 'dd/MM/yyyy' },
  { group: 'GENERAL', key: 'currency', value: 'PKR' },
  { group: 'SHORTCUTS', key: 'shortcut:command_palette', value: JSON.stringify({ action_id: 'command_palette', default_sequence: 'Ctrl+K', current_sequence: 'Ctrl+K', description: 'Command Palette', context: 'window', category: 'General' }) },
  { group: 'SHORTCUTS', key: 'shortcut:save', value: JSON.stringify({ action_id: 'save', default_sequence: 'Ctrl+S', current_sequence: 'Ctrl+S', description: 'Save', context: 'window', category: 'General' }) },
]

const audit: DRow[] = [
  { id: 1, action: 'DELETE', entityTable: 'sales_invoices', entityId: 1037, details: JSON.stringify({ reason: 'Duplicate draft removed' }), createdAt: `${today} 08:12:00`, username: 'admin' },
  { id: 2, action: 'UPDATE', entityTable: 'settings', entityId: null, details: JSON.stringify({ key: 'theme_name', from: 'dark', to: 'light' }), createdAt: daysAgo(1) + ' 16:20:00', username: 'admin' },
  { id: 3, action: 'INSERT', entityTable: 'purchase_invoices', entityId: 388, details: JSON.stringify({ invoice_number: 'PI-0388', total: 132800 }), createdAt: daysAgo(2) + ' 11:04:00', username: 'accounts' },
]

/** Return demo rows for a known query shape, or [] for unknown SQL. */
export function demoQuery<T>(sql: string): T[] {
  const candidates: [RegExp, DRow[]][] = [
    // Meta
    [/setting_key = 'theme_name'/i, [{ setting_value: 'dark' }]],
    [/from companies/i, companies],

    // Dashboard unions and aggregates (specific first).
    [/as type[\s\S]*union all/i, recent],
    [/date\(invoice_date\) = date[^)]*\)[\s\S]*from sales_invoices/i, [{ total: 420_000, count: 2 }]],
    [/date\(invoice_date\) = date[^)]*\)[\s\S]*from purchase_invoices/i, [{ total: 132_800, count: 1 }]],
    [/as cash[\s\S]*as bank[\s\S]*as receivable[\s\S]*as payable/i, [{ cash: 1_284_500, bank: 3_920_000, receivable: 1_239_500, payable: 860_000 }]],
    [/then jel\.credit else 0 end\), 0\) as revenue/i, [{ revenue: 2_450_000, expenses: 1_510_000 }]],
    [/\) as value/i, [{ value: 8_754_230 }]],
    [/count\(\*\) as count from items where/i, [{ count: 128 }]],
    [/having current_stock < i\.minimum_stock/i, lowStock],
    [/date\(sb\.expiry_date\) <= date/i, expiring],
    [/with recursive months/i, trend],
    [/as party_name/i, customers],
    [/from sales_invoice_items sii[\s\S]*group by i\.id/i, topItems],

    // Invoice detail (before the list).
    [/from sales_invoices si[\s\S]*and si\.id =/i, salesInvoices.filter((row) => row.id === sqlId(sql)).slice(0, 1)],
    [/from purchase_invoices pi[\s\S]*and pi\.id =/i, purchaseInvoices.filter((row) => row.id === sqlId(sql)).slice(0, 1)],
    [/from sales_invoice_items sii[\s\S]*sii\.invoice_id =/i, salesItems],
    [/from purchase_invoice_items pii[\s\S]*pii\.invoice_id =/i, purchaseItems],
    [/order by si\.invoice_date desc/i, salesInvoices],
    [/order by pi\.invoice_date desc/i, purchaseInvoices],

    // Parties
    [/party_type as partytype[\s\S]*from parties/i, partySummary.map(({ id, code, name, partyType }) => ({ id, code, name, partyType }))],
    [/left join journal_entry_lines/i, partySummary],
    [/select code, name, party_type from parties/i, (() => {
      const id = sqlId(sql)
      const party = partySummary.find((row) => row.id === id) ?? partySummary[0]
      return party ? [party] : []
    })()],
    [/as ob/i, [{ ob: 1_530_000 }]],
    [/jel\.party_id[\s\S]*order by je\.entry_date/i, ledgerEntries],

    // Items
    [/as stock_value/i, items],

    // Reports
    [/as totaldebit/i, trialBalance],
    [/a\.account_type = 'revenue'/i, plRevenue],
    [/a\.account_type = 'expense'/i, plExpenses],
    [/a\.account_type = 'asset'/i, balanceSheet.assets],
    [/a\.account_type = 'liability'/i, balanceSheet.liabilities],
    [/a\.account_type = 'equity'/i, balanceSheet.equity],
    [/a\.account_code in \('1000', '1020', '1010'\)/i, cashBook],

    // Administration
    [/from users u/i, users],
    [/from role_permissions rp/i, roleGrants],
    [/from roles order by name/i, roles],
    [/setting_group as "group"/i, settings],
    [/from audit_log al/i, audit],
  ]

  for (const [pattern, rows] of candidates) {
    if (pattern.test(sql)) return rows as T[]
  }
  return []
}
