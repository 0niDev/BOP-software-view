/** Company identity and appearance settings. */
import { queryOne } from '../sqlitecloud'
import type { CompanyInfo } from '../types'
import type { ThemeMode } from '../theme'

export async function fetchCompany(): Promise<CompanyInfo | null> {
  return queryOne<CompanyInfo>(
    `SELECT name, address, phone, email, ntn
     FROM companies
     WHERE is_active = 1
     ORDER BY id
     LIMIT 1`,
  )
}

export async function fetchThemeSetting(): Promise<ThemeMode | null> {
  const row = await queryOne<{ setting_value: string | null }>(
    `SELECT setting_value FROM settings WHERE setting_key = 'theme_name' LIMIT 1`,
  )
  const value = row?.setting_value?.toLowerCase()
  return value === 'dark' || value === 'light' || value === 'system' ? value : null
}
