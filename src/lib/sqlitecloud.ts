/**
 * Minimal typed client for the SQLite Cloud Weblite HTTP/JSON REST API.
 * Docs: https://docs.sqlitecloud.io/docs/weblite
 *
 * Every query is an HTTPS POST carrying { sql, database } with a Bearer token,
 * so the read-only view works from any static host including GitHub Pages.
 * Credentials come exclusively from import.meta.env (see .env.example).
 * NEVER commit the real key — use .env.local locally and repository secrets in CI.
 */
import type { Row } from './types'
import { demoQuery } from './demo'

export interface SqliteCloudConfig {
  url: string
  apiKey: string
  database: string
}

export function getConfig(): SqliteCloudConfig {
  const url = import.meta.env.VITE_SQLITECLOUD_URL
  const apiKey = import.meta.env.VITE_SQLITECLOUD_API_KEY
  const database = import.meta.env.VITE_SQLITECLOUD_DATABASE

  if (!url || !apiKey || !database) {
    throw new Error(
      'Missing SQLite Cloud configuration. Set VITE_SQLITECLOUD_URL, ' +
        'VITE_SQLITECLOUD_API_KEY and VITE_SQLITECLOUD_DATABASE ' +
        '(copy .env.example to .env.local).',
    )
  }
  return { url, apiKey, database }
}

export class SqlQueryError extends Error {
  readonly sql: string
  constructor(message: string, sql: string) {
    super(message)
    this.name = 'SqlQueryError'
    this.sql = sql
  }
}

interface WebliteError {
  error?: string | { status?: number; title?: string; detail?: string }
}

/**
 * Run a read-only SQL statement and return its rows as objects.
 * This app never mutates data; every query is built from constants or
 * fully-quoted parameters — never raw user input.
 */
export async function query<T extends object = Row>(sql: string): Promise<T[]> {
  // Demo mode: serve deterministic sample data without network or credentials.
  if (import.meta.env.VITE_DEMO_MODE === '1') return demoQuery<T>(sql)

  const { url, apiKey, database } = getConfig()

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ sql, database }),
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as WebliteError
      if (typeof body.error === 'string') detail = body.error
      else if (body.error?.detail) detail = body.error.detail
      else if (body.error?.title) detail = body.error.title
    } catch {
      /* keep the status-code message */
    }
    throw new SqlQueryError(detail, sql)
  }

  const payload = (await res.json()) as { data?: unknown }
  if (!Array.isArray(payload.data)) {
    throw new SqlQueryError('Unexpected response shape from Weblite', sql)
  }
  return payload.data as T[]
}

/** Run a read-only query expected to return at most one row. */
export async function queryOne<T extends object = Row>(sql: string): Promise<T | null> {
  const rows = await query<T>(sql)
  return rows[0] ?? null
}

/** Quote a value for safe interpolation into an IN (…) list or similar. */
export function quoteSql(value: string | number): string {
  return typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`
}

/** Quote a numeric id only when it is a finite integer (guards string input). */
export function safeId(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Invalid id')
  }
  return parsed
}
