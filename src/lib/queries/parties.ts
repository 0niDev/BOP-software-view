/**
 * Parties (customers and suppliers), their journal-derived balances, and the
 * party ledger. Conventions mirror web/server and the desktop ERP:
 * opening side = OPENING vouchers; running balance is signed by party type
 * (customer: debit − credit; supplier: credit − debit).
 */
import { query, queryOne, safeId } from '../sqlitecloud'
import { COMPANY_ID } from '../constants'
import type {
  LedgerEntry,
  PartiesSummaryData,
  PartyLedgerData,
  PartyOption,
  PartySummary,
} from '../types'

const n = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function fetchPartiesSummary(): Promise<PartiesSummaryData> {
  const rows = await query<{
    id: number
    code: string
    name: string
    partyType: string
    phone: string | null
    debit: number
    credit: number
  }>(
    `SELECT p.id, p.code, p.name, p.party_type AS partyType, p.phone,
            COALESCE(SUM(CASE WHEN je.is_posted = 1 THEN jel.debit ELSE 0 END), 0) AS debit,
            COALESCE(SUM(CASE WHEN je.is_posted = 1 THEN jel.credit ELSE 0 END), 0) AS credit
     FROM parties p
     LEFT JOIN journal_entry_lines jel ON jel.party_id = p.id
     LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
     WHERE p.company_id = ${COMPANY_ID} AND p.is_active = 1
     GROUP BY p.id, p.code, p.name, p.party_type, p.phone
     ORDER BY p.name`,
  )

  const parties: PartySummary[] = rows.map((row) => {
    const debit = n(row.debit)
    const credit = n(row.credit)
    const isCustomer = row.partyType === 'CUSTOMER' || row.partyType === 'BOTH'
    const signed = isCustomer ? debit - credit : credit - debit
    const kind: PartySummary['kind'] =
      Math.abs(signed) < 0.01 ? 'Settled' : signed > 0 ? (isCustomer ? 'Receivable' : 'Payable') : isCustomer ? 'Payable' : 'Receivable'
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      partyType: row.partyType,
      phone: row.phone,
      debit,
      credit,
      balance: signed,
      kind,
    }
  })

  return {
    receivable: parties
      .filter((party) => party.kind === 'Receivable')
      .reduce((sum, party) => sum + Math.abs(party.balance), 0),
    payable: parties
      .filter((party) => party.kind === 'Payable')
      .reduce((sum, party) => sum + Math.abs(party.balance), 0),
    parties,
  }
}

export async function fetchPartyLedger(
  partyId: number | string,
  from?: string,
  to?: string,
): Promise<PartyLedgerData> {
  const id = safeId(partyId)

  const partyRow = await queryOne<{ code: string; name: string; party_type: string }>(
    `SELECT code, name, party_type FROM parties
     WHERE id = ${id} AND company_id = ${COMPANY_ID}`,
  )
  if (!partyRow) throw new Error('Party not found')

  const isCustomer = partyRow.party_type === 'CUSTOMER' || partyRow.party_type === 'BOTH'
  const periodTo = to ? `AND je.entry_date <= '${to}'` : ''
  const beforeFrom = from
    ? `AND je.entry_date < '${from}'`
    : ''

  // Opening side: OPENING vouchers (or everything before the period start).
  const openingRow = await queryOne<{ ob: number }>(
    `SELECT COALESCE(SUM(jel.debit - jel.credit), 0) AS ob
     FROM journal_entry_lines jel
     JOIN journal_entries je ON je.id = jel.journal_entry_id
     WHERE jel.party_id = ${id} AND je.is_posted = 1
       AND (je.voucher_type = 'OPENING' OR (je.voucher_type != 'OPENING' ${beforeFrom}))
       ${from ? '' : "AND je.voucher_type = 'OPENING'"}`,
  )

  const openingNet = n(openingRow?.ob)
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
     WHERE jel.party_id = ${id} AND je.is_posted = 1
       AND je.voucher_type != 'OPENING'
       ${from ? `AND je.entry_date >= '${from}'` : ''}
       ${periodTo}
     ORDER BY je.entry_date, je.id, jel.line_order`,
  )

  const entries: LedgerEntry[] = []
  let running = openingBalance
  let totalDebit = 0
  let totalCredit = 0

  for (const row of rows) {
    const debit = n(row.debit)
    const credit = n(row.credit)
    running += isCustomer ? debit - credit : credit - debit
    totalDebit += debit
    totalCredit += credit
    entries.push({
      date: row.entry_date,
      voucherNumber: row.voucher_number,
      voucherType: row.voucher_type,
      description: row.description || row.voucher_type,
      accountCode: row.account_code,
      accountName: row.account_name,
      debit,
      credit,
      running,
    })
  }

  let balanceLabel = 'Settled'
  if (running > 0.01) {
    balanceLabel = isCustomer ? 'Receivable — customer owes us' : 'Payable — we owe the supplier'
  } else if (running < -0.01) {
    balanceLabel = isCustomer ? 'Credit balance — customer overpaid' : 'Debit balance — supplier owes us'
  }

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

export async function fetchPartyOptions(): Promise<PartyOption[]> {
  return query<PartyOption>(
    `SELECT id, code, name, party_type AS partyType
     FROM parties
     WHERE company_id = ${COMPANY_ID} AND is_active = 1
     ORDER BY name`,
  )
}
