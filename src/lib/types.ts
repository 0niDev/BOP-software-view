/** Shared row and view-model types. Row values mirror SQLite JSON output. */

export type Row = Record<string, string | number | null>

export interface CompanyInfo {
  name: string
  address: string | null
  phone: string | null
  email: string | null
  ntn: string | null
}

/* ----------------------------------------------------------------- dashboard */

export interface DashboardToday {
  salesTotal: number
  salesCount: number
  purchasesTotal: number
  purchasesCount: number
}

export interface DashboardBalances {
  cash: number
  bank: number
  inventory: number
  total: number
  receivable: number
  payable: number
}

export interface DashboardProfitLoss {
  revenue: number
  expenses: number
  profit: number
  isProfit: boolean
}

export interface RecentTransaction {
  reference: string
  date: string
  type: 'Sales' | 'Purchases' | 'Payment' | 'Receipt' | 'Expense'
  amount: number
  partyName: string | null
}

export interface LowStockItem {
  itemCode: string
  itemName: string
  unit: string
  currentStock: number
  minimumStock: number
}

export interface ExpiringItem {
  itemCode: string
  itemName: string
  unit: string
  batchNumber: string
  expiryDate: string | null
  quantityInStock: number
}

export interface DashboardAlert {
  type: 'warning' | 'danger' | 'success' | 'info'
  title: string
  message: string
}

export interface TrendPoint {
  month: string
  revenue: number
  expenses: number
  profit: number
}

export interface TopItem {
  itemCode: string
  itemName: string
  quantity: number
  revenue: number
  customers: number
}

export interface CustomerSale {
  partyName: string
  revenue: number
  invoices: number
}

export interface DashboardData {
  today: DashboardToday
  balances: DashboardBalances
  profitLoss: DashboardProfitLoss
  recentTransactions: RecentTransaction[]
  inventory: {
    totalItems: number
    lowStockCount: number
    lowStockItems: LowStockItem[]
    minimumConfigured: number
    expiringCount: number
    expiringItems: ExpiringItem[]
  }
  alerts: DashboardAlert[]
  monthlyTrend: TrendPoint[]
  topItems: TopItem[]
  salesByCustomer: CustomerSale[]
}

/* ------------------------------------------------------------------ invoices */

export type InvoiceKind = 'sales' | 'purchases'

export interface InvoiceRow {
  id: number
  invoiceNumber: string
  partyCode: string
  partyName: string
  date: string
  paymentType: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balance: number
  status: string
  warehouse: string | null
  notes: string | null
}

export interface InvoiceItem {
  id: number
  itemCode: string
  itemName: string
  unit: string
  quantity: number
  unitPrice: number
  discountAmount: number
  taxAmount: number
  lineTotal: number
  batchNumber: string | null
  expiryDate: string | null
}

export interface InvoiceDetail {
  invoice: InvoiceRow
  items: InvoiceItem[]
}

/* ------------------------------------------------------------------- parties */

export interface PartySummary {
  id: number
  code: string
  name: string
  partyType: string
  phone: string | null
  debit: number
  credit: number
  balance: number
  kind: 'Receivable' | 'Payable' | 'Settled'
}

export interface PartiesSummaryData {
  receivable: number
  payable: number
  parties: PartySummary[]
}

export interface PartyOption {
  id: number
  code: string
  name: string
  partyType: string
}

export interface LedgerEntry {
  date: string
  voucherNumber: string
  voucherType: string
  description: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  running: number
}

export interface PartyLedgerData {
  party: {
    code: string
    name: string
    partyType: string
  }
  isCustomer: boolean
  openingBalance: number
  entries: LedgerEntry[]
  totalDebit: number
  totalCredit: number
  closingBalance: number
  balanceLabel: string
}

/* --------------------------------------------------------------------- items */

export interface ItemRow {
  id: number
  itemCode: string
  itemName: string
  itemType: string
  unit: string
  category: string | null
  minimumStock: number
  purchasePrice: number
  sellingPrice: number
  stock: number
  stockValue: number
  batchCount: number
  nearestExpiry: string | null
  isActive: boolean
}

/* ------------------------------------------------------------------- reports */

export interface TrialBalanceRow {
  code: string
  name: string
  accountType: string
  openingDebit: number
  openingCredit: number
  closingDebit: number
  closingCredit: number
}

export interface TrialBalanceData {
  rows: TrialBalanceRow[]
  totalClosingDebit: number
  totalClosingCredit: number
  isBalanced: boolean
  balanceDiff: number
}

export interface ReportLine {
  code: string
  name: string
  amount: number
}

export interface ProfitLossData {
  revenue: ReportLine[]
  expenses: ReportLine[]
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  isProfit: boolean
}

export interface BalanceSheetData {
  assets: ReportLine[]
  liabilities: ReportLine[]
  equity: ReportLine[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

export interface CashBookEntry {
  voucherNumber: string
  date: string
  description: string
  accountName: string
  debit: number
  credit: number
}

export interface CashBookData {
  entries: CashBookEntry[]
  totalDebit: number
  totalCredit: number
  closingBalance: number
}

/* --------------------------------------------------------------------- admin */

export interface UserRow {
  id: number
  username: string
  fullName: string
  email: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface RoleRow {
  id: number
  name: string
  description: string | null
  permissionCount: number
  permissions: string[]
}

export interface SettingRow {
  group: string
  key: string
  value: string | null
}

export interface AuditRow {
  id: number
  action: string
  entityTable: string
  entityId: number | null
  details: string | null
  createdAt: string
  username: string | null
}
