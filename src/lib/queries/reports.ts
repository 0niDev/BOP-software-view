/**
 * Financial reports. Conventions mirror web/server and the desktop ERP:
 *  - Trial balance: opening = OPENING vouchers, closing = all posted lines;
 *  - P&L: period side excludes OPENING vouchers;
 *  - Balance sheet: journal-derived up to an as-of date;
 *  - Cash book: cash (1000/1020) and bank (1010), excluding OPENING.
 */
import { query } from '../sqlitecloud'
import { COMPANY_ID } from '../constants'
import { todayISO } from '../format'
import type {
  BalanceSheetData,
  CashBookData,
  ProfitLossData,
  ReportLine,
  TrialBalanceData,
  TrialBalanceRow,
} from '../types'

const n = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const round2 = (value: number): number => Math.round(value * 100) / 100

export async function fetchTrialBalance(): Promise<TrialBalanceData> {
  const rows = await query<{
    code: string
    name: string
    accountType: string
    odr: number
    ocr: number
    totalDebit: number
    totalCredit: number
  }>(
    `SELECT a.account_code AS code, a.account_name AS name, a.account_type AS accountType,
            COALESCE(SUM(CASE WHEN je.voucher_type = 'OPENING' AND je.is_posted = 1 THEN jel.debit ELSE 0 END), 0) AS odr,
            COALESCE(SUM(CASE WHEN je.voucher_type = 'OPENING' AND je.is_posted = 1 THEN jel.credit ELSE 0 END), 0) AS ocr,
            COALESCE(SUM(CASE WHEN je.is_posted = 1 THEN jel.debit ELSE 0 END), 0) AS totalDebit,
            COALESCE(SUM(CASE WHEN je.is_posted = 1 THEN jel.credit ELSE 0 END), 0) AS totalCredit
     FROM accounts a
     LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
     LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
     WHERE a.company_id = ${COMPANY_ID} AND a.is_active = 1
     GROUP BY a.id, a.account_code, a.account_name, a.account_type
     HAVING totalDebit != 0 OR totalCredit != 0
     ORDER BY a.account_code`,
  )

  const resultRows: TrialBalanceRow[] = []
  let totalDebit = 0
  let totalCredit = 0

  for (const row of rows) {
    const isDebitNature = row.accountType === 'ASSET' || row.accountType === 'EXPENSE'
    const openingDebit = n(row.odr)
    const openingCredit = n(row.ocr)
    const periodDebit = n(row.totalDebit)
    const periodCredit = n(row.totalCredit)
    const net = isDebitNature
      ? openingDebit + periodDebit - periodCredit
      : openingCredit + periodCredit - periodDebit

    // A negative net flips to the opposite column.
    const closingDebit = isDebitNature ? Math.max(net, 0) : Math.max(-net, 0)
    const closingCredit = isDebitNature ? Math.max(-net, 0) : Math.max(net, 0)

    totalDebit += closingDebit
    totalCredit += closingCredit

    resultRows.push({
      code: row.code,
      name: row.name,
      accountType: row.accountType,
      openingDebit,
      openingCredit,
      closingDebit: round2(closingDebit),
      closingCredit: round2(closingCredit),
    })
  }

  const diff = round2(Math.abs(totalDebit - totalCredit))
  return {
    rows: resultRows,
    totalClosingDebit: round2(totalDebit),
    totalClosingCredit: round2(totalCredit),
    isBalanced: diff < 0.01,
    balanceDiff: diff,
  }
}

export async function fetchProfitLoss(dateFrom?: string, dateTo?: string): Promise<ProfitLossData> {
  const from = dateFrom ?? `${new Date().getFullYear()}-01-01`
  const to = dateTo ?? todayISO()

  const lineQuery = (accountType: 'REVENUE' | 'EXPENSE') => {
    const expression = accountType === 'REVENUE' ? 'jel.credit - jel.debit' : 'jel.debit - jel.credit'
    return `SELECT a.account_code AS code, a.account_name AS name,
                   COALESCE(SUM(CASE WHEN je.is_posted = 1 AND je.voucher_type != 'OPENING'
                                     AND je.entry_date >= '${from}' AND je.entry_date <= '${to}'
                                     THEN ${expression} ELSE 0 END), 0) AS amount
            FROM accounts a
            LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
            WHERE a.company_id = ${COMPANY_ID} AND a.account_type = '${accountType}' AND a.is_active = 1
            GROUP BY a.id, a.account_code, a.account_name
            ORDER BY a.account_code`
  }

  const [revenueRows, expenseRows] = await Promise.all([
    query<ReportLine>(lineQuery('REVENUE')),
    query<ReportLine>(lineQuery('EXPENSE')),
  ])

  const revenue = revenueRows
    .map((row) => ({ ...row, amount: round2(n(row.amount)) }))
    .filter((row) => row.amount !== 0)
  const expenses = expenseRows
    .map((row) => ({ ...row, amount: round2(n(row.amount)) }))
    .filter((row) => row.amount !== 0)

  const totalRevenue = round2(revenue.reduce((sum, row) => sum + row.amount, 0))
  const totalExpenses = round2(expenses.reduce((sum, row) => sum + row.amount, 0))
  const netProfit = round2(totalRevenue - totalExpenses)

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netProfit,
    isProfit: netProfit >= 0,
  }
}

export async function fetchBalanceSheet(asOf?: string): Promise<BalanceSheetData> {
  const date = asOf ?? todayISO()

  const sectionQuery = (accountType: string, expression: string) => `
    SELECT a.account_code AS code, a.account_name AS name,
           COALESCE(SUM(CASE WHEN je.is_posted = 1 AND je.entry_date <= '${date}'
                             THEN ${expression} ELSE 0 END), 0) AS amount
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE a.company_id = ${COMPANY_ID} AND a.account_type = '${accountType}' AND a.is_active = 1
    GROUP BY a.id, a.account_code, a.account_name
    ORDER BY a.account_code`

  const [assetRows, liabilityRows, equityRows] = await Promise.all([
    query<ReportLine>(sectionQuery('ASSET', 'jel.debit - jel.credit')),
    query<ReportLine>(sectionQuery('LIABILITY', 'jel.credit - jel.debit')),
    query<ReportLine>(sectionQuery('EQUITY', 'jel.credit - jel.debit')),
  ])

  const clean = (rows: ReportLine[]): ReportLine[] =>
    rows.map((row) => ({ ...row, amount: round2(n(row.amount)) })).filter((row) => row.amount !== 0)

  const assets = clean(assetRows)
  const liabilities = clean(liabilityRows)
  const equity = clean(equityRows)

  const totalAssets = round2(assets.reduce((sum, row) => sum + row.amount, 0))
  const totalLiabilities = round2(liabilities.reduce((sum, row) => sum + row.amount, 0))
  const totalEquity = round2(equity.reduce((sum, row) => sum + row.amount, 0))
  const totalLiabilitiesAndEquity = round2(totalLiabilities + totalEquity)

  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
  }
}

export async function fetchCashBook(dateFrom?: string, dateTo?: string): Promise<CashBookData> {
  const from = dateFrom ?? `${new Date().getFullYear()}-01-01`
  const to = dateTo ?? todayISO()

  const rows = await query<{
    voucherNumber: string
    date: string
    description: string | null
    accountName: string
    debit: number
    credit: number
  }>(
    `SELECT je.voucher_number AS voucherNumber, je.entry_date AS date,
            jel.description, a.account_name AS accountName,
            jel.debit, jel.credit
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
     JOIN accounts a ON a.id = jel.account_id
     WHERE je.company_id = ${COMPANY_ID} AND je.is_posted = 1
       AND je.voucher_type != 'OPENING'
       AND a.account_code IN ('1000', '1020', '1010')
       AND je.entry_date >= '${from}' AND je.entry_date <= '${to}'
     ORDER BY je.entry_date, je.voucher_number, jel.line_order`,
  )

  const entries = rows.map((row) => ({
    voucherNumber: row.voucherNumber,
    date: row.date,
    description: row.description || row.voucherNumber,
    accountName: row.accountName,
    debit: n(row.debit),
    credit: n(row.credit),
  }))

  const totalDebit = round2(entries.reduce((sum, row) => sum + row.debit, 0))
  const totalCredit = round2(entries.reduce((sum, row) => sum + row.credit, 0))

  return {
    entries,
    totalDebit,
    totalCredit,
    closingBalance: round2(totalDebit - totalCredit),
  }
}
