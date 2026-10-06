/**
 * Financial reports. Conventions mirror the desktop ERP:
 *  - Trial balance: opening = OPENING vouchers, closing = all posted lines;
 *  - P&L: period side must exclude OPENING vouchers;
 *  - Balance sheet: journal-derived, no legacy opening_balance column;
 *  - Cash book: journal lines on cash (1000) / bank (1010), excluding OPENING.
 */
import { query } from '../sqlitecloud'
import type {
  BalanceSheetData,
  CashBookData,
  ProfitLossData,
  ReportLine,
  TrialBalanceData,
  TrialBalanceRow,
} from '../types'
import { todayISO } from '../format'

export async function fetchTrialBalance(): Promise<TrialBalanceData> {
  const rows = await query<{
    code: string
    name: string
    account_type: string
    odr: number
    ocr: number
    total_debit: number
    total_credit: number
  }>(
    `SELECT a.account_code AS code, a.account_name AS name, a.account_type,
            COALESCE(SUM(CASE WHEN je.voucher_type = 'OPENING' THEN jel.debit ELSE 0 END), 0) AS odr,
            COALESCE(SUM(CASE WHEN je.voucher_type = 'OPENING' THEN jel.credit ELSE 0 END), 0) AS ocr,
            COALESCE(SUM(jel.debit), 0) AS total_debit,
            COALESCE(SUM(jel.credit), 0) AS total_credit
     FROM accounts a
     LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
     LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_posted = 1
     WHERE a.is_active = 1
     GROUP BY a.id
     HAVING total_debit != 0 OR total_credit != 0
     ORDER BY a.account_code`,
  )

  const resultRows: TrialBalanceRow[] = []
  let totalCdr = 0
  let totalCcr = 0

  for (const row of rows) {
    const isDebitNature = row.account_type === 'ASSET' || row.account_type === 'EXPENSE'
    const odr = row.odr ?? 0
    const ocr = row.ocr ?? 0
    const totalDebit = row.total_debit ?? 0
    const totalCredit = row.total_credit ?? 0
    const net = isDebitNature
      ? odr + totalDebit - totalCredit
      : ocr + totalCredit - totalDebit

    // Debit-nature accounts show a positive net on the debit side; credit-nature
    // on the credit side. A negative net flips to the opposite column.
    const closingDebit = isDebitNature ? Math.max(net, 0) : Math.max(-net, 0)
    const closingCredit = isDebitNature ? Math.max(-net, 0) : Math.max(net, 0)

    totalCdr += closingDebit
    totalCcr += closingCredit

    resultRows.push({
      code: row.code,
      name: row.name,
      accountType: row.account_type,
      openingDebit: row.odr,
      openingCredit: row.ocr,
      closingDebit: Math.round(closingDebit * 100) / 100,
      closingCredit: Math.round(closingCredit * 100) / 100,
    })
  }

  const diff = Math.round(Math.abs(totalCdr - totalCcr) * 100) / 100
  return {
    rows: resultRows,
    totalClosingDebit: Math.round(totalCdr * 100) / 100,
    totalClosingCredit: Math.round(totalCcr * 100) / 100,
    isBalanced: diff < 0.01,
    balanceDiff: diff,
  }
}

export async function fetchProfitLoss(dateFrom?: string, dateTo?: string): Promise<ProfitLossData> {
  const from = dateFrom ?? `${new Date().getFullYear()}-01-01`
  const to = dateTo ?? todayISO()

  const lineQuery = (accountType: 'REVENUE' | 'EXPENSE') => `
    SELECT a.account_code AS code, a.account_name AS name,
           COALESCE(SUM(jel.credit - jel.debit), 0) AS amount
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE a.account_type = '${accountType}' AND a.is_active = 1
      AND je.is_posted = 1 AND je.voucher_type != 'OPENING'
      AND je.entry_date >= date('${from}') AND je.entry_date <= date('${to}')
    GROUP BY a.id
    ORDER BY a.account_code`

  const [revenueRows, expenseRows] = await Promise.all([
    query<{ code: string; name: string; amount: number }>(lineQuery('REVENUE')),
    query<{ code: string; name: string; amount: number }>(
      `SELECT a.account_code AS code, a.account_name AS name,
              COALESCE(SUM(jel.debit - jel.credit), 0) AS amount
       FROM accounts a
       LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
       WHERE a.account_type = 'EXPENSE' AND a.is_active = 1
         AND je.is_posted = 1 AND je.voucher_type != 'OPENING'
         AND je.entry_date >= date('${from}') AND je.entry_date <= date('${to}')
       GROUP BY a.id
       ORDER BY a.account_code`,
    ),
  ])

  const revenue: ReportLine[] = revenueRows.filter((r) => r.amount !== 0)
  const expenses: ReportLine[] = expenseRows.filter((r) => r.amount !== 0)
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netProfit,
    isProfit: netProfit >= 0,
  }
}

export async function fetchBalanceSheet(): Promise<BalanceSheetData> {
  const sectionQuery = (accountType: string, sign: string) => `
    SELECT a.account_code AS code, a.account_name AS name,
           COALESCE(SUM(${sign}), 0) AS amount
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_posted = 1
    WHERE a.account_type = '${accountType}' AND a.is_active = 1
    GROUP BY a.id
    ORDER BY a.account_code`

  const [assetRows, liabilityRows, equityRows] = await Promise.all([
    query<ReportLine>(sectionQuery('ASSET', 'jel.debit - jel.credit')),
    query<ReportLine>(sectionQuery('LIABILITY', 'jel.credit - jel.debit')),
    query<ReportLine>(sectionQuery('EQUITY', 'jel.credit - jel.debit')),
  ])

  const assets = assetRows.filter((r) => r.amount !== 0)
  const liabilities = liabilityRows.filter((r) => r.amount !== 0)
  const equity = equityRows.filter((r) => r.amount !== 0)

  const totalAssets = assets.reduce((sum, r) => sum + r.amount, 0)
  const totalLiabilities = liabilities.reduce((sum, r) => sum + r.amount, 0)
  const totalEquity = equity.reduce((sum, r) => sum + r.amount, 0)
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

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

  const entries = await query<{
    voucher_number: string
    entry_date: string
    description: string | null
    account_name: string
    debit: number
    credit: number
  }>(
    `SELECT je.voucher_number, je.entry_date, je.description,
            a.account_name, jel.debit, jel.credit
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
     JOIN accounts a ON a.id = jel.account_id
     WHERE je.is_posted = 1 AND je.voucher_type != 'OPENING'
       AND a.account_code IN ('1000', '1010')
       AND je.entry_date >= date('${from}') AND je.entry_date <= date('${to}')
     ORDER BY je.entry_date, je.voucher_number`,
  )

  const totalDebit = entries.reduce((sum, e) => sum + (e.debit ?? 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit ?? 0), 0)

  return {
    entries: entries.map((e) => ({
      voucherNumber: e.voucher_number,
      date: e.entry_date,
      description: e.description || e.voucher_number,
      accountName: e.account_name,
      debit: e.debit ?? 0,
      credit: e.credit ?? 0,
    })),
    totalDebit,
    totalCredit,
    closingBalance: totalDebit - totalCredit,
  }
}
