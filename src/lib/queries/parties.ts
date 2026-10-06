/**
 * Parties queries. The party ledger follows the desktop ERP convention
 * (reports/party_ledger_report.py): join on journal_entry_lines.party_id,
 * opening side = pre-period OPENING vouchers, running balance signed by
 * party type (customer: debit − credit; supplier: credit − debit).
 */
import { query } from '../sqlitecloud'
import type { LedgerEntry, PartyLedgerData, PartiesSummaryData, PartySummary } from '../types'

export async function fetchPartiesSummary(): Promise<PartiesSummaryData> {
  const rows = await query<{
    id: number
    code: string
    name: string
    party_type: string
    debit: number
    credit: number
  }>(
    `SELECT p.id, p.code, p.name, p.party_type,
            COALESCE(SUM(jel.debit), 0) AS debit,
            COALESCE(SUM(jel.credit), 0) AS credit
     FROM parties p
     JOIN journal_entry_lines jel ON jel.party_id = p.id
     JOIN journal_entries je ON je.id = jel.journal_entry_id
     WHERE p.is_active = 1 AND je.is_posted = 1
     GROUP BY p.id
     ORDER BY p.name`,
  )

  const parties: PartySummary[] = rows.map((r) => {
    const isCustomer = r.party_type === 'CUSTOMER' || r.party_type === 'BOTH'
    const signed = isCustomer ? r.debit - r.credit : r.credit - r.debit
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      partyType: r.party_type,
      debit: r.debit,
      credit: r.credit,
      balance: signed,
      kind: signed > 0.01 ? 'Receivable' : signed < -0.01 ? 'Payable' : 'Settled',
    }
  })

  return {
    receivable: parties
      .filter((p) => p.balance > 0)
      .reduce((sum, p) => sum + p.balance, 0),
    payable: parties
      .filter((p) => p.balance < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance), 0),
    parties,
  }
}

export async function fetchPartyLedger(partyId: number): Promise<PartyLedgerData> {
  const partyRows = await query<{
    code: string
    name: string
    party_type: string
  }>(`SELECT code, name, party_type FROM parties WHERE id = ${partyId}`)

  const partyRow = partyRows[0]
  if (!partyRow) throw new Error('Party not found')

  const isCustomer = partyRow.party_type === 'CUSTOMER' || partyRow.party_type === 'BOTH'

  const openingRows = await query<{ ob: number }>(
    `SELECT COALESCE(SUM(jel.debit - jel.credit), 0) AS ob
     FROM journal_entry_lines jel
     JOIN journal_entries je ON je.id = jel.journal_entry_id
     WHERE jel.party_id = ${partyId} AND je.voucher_type = 'OPENING'
       AND je.is_posted = 1`,
  )
  const openingNet = openingRows[0]?.ob ?? 0
  const openingBalance = isCustomer ? openingNet : -openingNet

  const rows = await query<{
    entry_date: string
    voucher_number: string
    voucher_type: string
    description: string | null
    debit: number
    credit: number
    account_code: string
    account_name: string
  }>(
    `SELECT je.entry_date, je.voucher_number, je.voucher_type,
            jel.description, jel.debit, jel.credit,
            a.account_code, a.account_name
     FROM journal_entry_lines jel
     JOIN journal_entries je ON je.id = jel.journal_entry_id
     JOIN accounts a ON a.id = jel.account_id
     WHERE jel.party_id = ${partyId} AND je.is_posted = 1
     ORDER BY je.entry_date, je.id`,
  )

  const entries: LedgerEntry[] = []
  let running = openingBalance
  let totalDebit = 0
  let totalCredit = 0

  for (const r of rows) {
    const debit = r.debit ?? 0
    const credit = r.credit ?? 0
    running += isCustomer ? debit - credit : credit - debit
    totalDebit += debit
    totalCredit += credit
    entries.push({
      date: r.entry_date,
      voucherNumber: r.voucher_number,
      voucherType: r.voucher_type,
      description: r.description || r.voucher_type,
      accountCode: r.account_code,
      accountName: r.account_name,
      debit,
      credit,
      running,
    })
  }

  let balanceLabel = 'Zero Balance'
  if (running > 0.01) balanceLabel = isCustomer ? 'Receivable (Customer owes us)' : 'Payable (We owe supplier)'
  else if (running < -0.01) balanceLabel = isCustomer ? 'Credit Balance (Customer overpaid)' : 'Debit Balance (Supplier owes us)'

  return {
    party: { code: partyRow.code, name: partyRow.name, partyType: partyRow.party_type },
    isCustomer,
    openingBalance,
    entries,
    totalDebit,
    totalCredit,
    closingBalance: running,
    balanceLabel,
  }
}

/** Minimal party list for the ledger picker. */
export interface PartyOption {
  id: number
  code: string
  name: string
  partyType: string
}

export async function fetchPartyOptions(): Promise<PartyOption[]> {
  return query<PartyOption>(
    `SELECT id, code, name, party_type AS partyType
     FROM parties WHERE is_active = 1 ORDER BY name`,
  )
}
