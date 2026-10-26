/** CSV / text download helpers (client-side, no server round-trip). */

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: { key: string; label: string }[],
): void {
  if (rows.length === 0) return
  const keys = columns ? columns.map((column) => column.key) : Object.keys(rows[0] ?? {})
  const headers = columns ? columns.map((column) => column.label) : keys
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => keys.map((key) => escapeCell(row[key])).join(',')),
  ]
  // BOM keeps Excel happy with the ₨/Rs symbol and non-ASCII names.
  saveBlob(new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), filename)
}

export function printReport(): void {
  window.print()
}
