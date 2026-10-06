/** Shared row and view-model types. Row values mirror SQLite JSON output. */

export type Row = Record<string, string | number | null>

export interface TodaySales {
  total: number
  count: number
}

export interface DashboardData {
  todaySales: TodaySales
  todayPurchases: TodaySales
  cash: number
  bank: number
  inventoryValue: number
  revenue: number
  totalItems: number
  totalParties: number
  recent: RecentTransaction[]
}

export interface RecentTransaction {
  reference: string
  date: string
  type: 'Sales' | 'Purchase'
  amount: number
}

export interface SalesTrendPoint {
  date: string
  sales: number
  purchases: number
}

export interface PartySummary {
  id: number
  code: string
  name: string
  partyType: string
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

export interface InvoiceRow {
  invoiceNumber: string
  partyName: string
  date: string
  totalAmount: number
  paidAmount: number
  balance: number
  status: string
}

export interface StockRow {
  itemCode: string
  itemName: string
  unit: string
  totalStock: number
  minimumStock: number
  stockValue: number
  batchCount: number
  isLow: boolean
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
