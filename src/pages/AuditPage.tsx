import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Download, History, Trash2, UserCog } from 'lucide-react'
import { fetchAuditLog } from '../lib/queries/admin'
import { formatDateTime, formatNumber } from '../lib/format'
import { downloadCsv } from '../lib/download'
import type { AuditRow } from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import Drawer from '../components/ui/Drawer'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill, { type PillTone } from '../components/ui/StatusPill'
import { ErrorState } from '../components/ui/States'
import FilterBox from '../components/FilterBox'
import ReadOnlyNotice from '../components/ReadOnlyNotice'

function actionTone(action: string): PillTone {
  const value = action.toUpperCase()
  if (value.includes('DELETE') || value.includes('REMOVE')) return 'danger'
  if (value.includes('CREATE') || value.includes('INSERT') || value.includes('POST')) return 'ok'
  if (value.includes('UPDATE') || value.includes('EDIT')) return 'warn'
  if (value.includes('LOGIN') || value.includes('LOGOUT')) return 'info'
  return 'neutral'
}

function preview(details: string | null): string {
  if (!details) return '—'
  const compact = details.replace(/\s+/g, ' ').trim()
  return compact.length > 90 ? `${compact.slice(0, 90)}…` : compact
}

function prettyDetails(details: string | null): string {
  if (!details) return 'No additional detail recorded.'
  try {
    return JSON.stringify(JSON.parse(details) as unknown, null, 2)
  } catch {
    return details
  }
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [selected, setSelected] = useState<AuditRow | null>(null)

  const audit = useQuery({ queryKey: ['admin-audit'], queryFn: fetchAuditLog })
  const allRows = audit.data ?? []

  const actions = useMemo(() => [...new Set(allRows.map((row) => row.action))].sort(), [allRows])

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allRows.filter((row) => {
      if (actionFilter && row.action !== actionFilter) return false
      if (!needle) return true
      return (
        row.action.toLowerCase().includes(needle) ||
        row.entityTable.toLowerCase().includes(needle) ||
        (row.username ?? '').toLowerCase().includes(needle) ||
        (row.details ?? '').toLowerCase().includes(needle)
      )
    })
  }, [allRows, search, actionFilter])

  const deleteCount = allRows.filter((row) => row.action.toUpperCase().includes('DELETE')).length
  const updateCount = allRows.filter((row) => row.action.toUpperCase().includes('UPDATE')).length
  const uniqueUsers = new Set(allRows.map((row) => row.username ?? 'system')).size

  const columns: Column<AuditRow>[] = [
    {
      key: 'when',
      header: 'When',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="num whitespace-nowrap text-[11px] text-muted">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortValue: (row) => row.action,
      render: (row) => <StatusPill value={row.action} tone={actionTone(row.action)} />,
    },
    {
      key: 'entity',
      header: 'Entity',
      sortValue: (row) => `${row.entityTable}#${row.entityId ?? ''}`,
      render: (row) => (
        <span className="text-[12px] font-semibold text-ink">
          {row.entityTable}
          {row.entityId != null && <span className="num text-muted"> #{row.entityId}</span>}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      sortValue: (row) => row.username ?? '',
      render: (row) => <span className="text-[11px] font-semibold text-muted">{row.username ?? 'system'}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => (
        <span className="block max-w-[360px] truncate text-[11px] text-muted" title={row.details ?? undefined}>
          {preview(row.details)}
        </span>
      ),
      hideBelow: 'md',
    },
  ]

  const exportRows = (): void => {
    downloadCsv(
      'audit-log.csv',
      rows.map((row) => ({
        timestamp: row.createdAt,
        action: row.action,
        entity: row.entityTable,
        entityId: row.entityId,
        user: row.username,
        details: row.details,
      })),
      [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'action', label: 'Action' },
        { key: 'entity', label: 'Entity' },
        { key: 'entityId', label: 'Entity ID' },
        { key: 'user', label: 'User' },
        { key: 'details', label: 'Details' },
      ],
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Administration"
        title="Audit Log"
        subtitle="The most recent 250 recorded actions across the ERP"
        actions={
          <button
            type="button"
            onClick={exportRows}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
          >
            <Download size={14} aria-hidden />
            Export CSV
          </button>
        }
      />

      <ReadOnlyNotice title="Read-only audit trail">
        Audit entries are shown exactly as recorded. This view cannot delete entries or alter their
        history.
      </ReadOnlyNotice>

      {audit.isError ? (
        <ErrorState
          message={audit.error instanceof Error ? audit.error.message : 'Could not load the audit log.'}
          onRetry={() => audit.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              icon={History}
              label="Entries"
              value={formatNumber(allRows.length)}
              hint="Most recent 250"
              tone="brand"
            />
            <StatCard
              icon={Activity}
              label="Updates"
              value={formatNumber(updateCount)}
              hint="Edit operations"
              tone="amber"
            />
            <StatCard
              icon={Trash2}
              label="Deletes"
              value={formatNumber(deleteCount)}
              hint="Removal operations"
              tone={deleteCount ? 'danger' : 'ok'}
            />
            <StatCard
              icon={UserCog}
              label="Actors"
              value={formatNumber(uniqueUsers)}
              hint="Users or system"
              tone="teal"
            />
          </div>

          <Card
            title="Recent activity"
            subtitle={`${formatNumber(rows.length)} of ${formatNumber(allRows.length)} entries`}
            action={
              <div className="flex flex-wrap items-end gap-2">
                <FilterBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search action, entity or user…"
                  className="w-full sm:w-[230px]"
                />
                <select
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  aria-label="Filter by action"
                  className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">All actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              loading={audit.isLoading}
              initialSortKey="when"
              initialSortDir="desc"
              pageSize={25}
              onRowClick={(row) => setSelected(row)}
              emptyTitle="No audit entries match these filters"
              emptyHint="Audit entries are written by the desktop ERP as records change."
              caption="Audit log"
            />
            <p className="mt-3 text-[11px] text-muted">Click a row to see the full recorded detail.</p>
          </Card>
        </>
      )}

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.action} · ${selected.entityTable}` : 'Audit entry'}
        subtitle={selected ? formatDateTime(selected.createdAt) : undefined}
        width="narrow"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-surface-2 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Entity</p>
                <p className="mt-0.5 text-[13px] font-bold text-ink">{selected.entityTable}</p>
                <p className="num text-[11px] text-muted">ID {selected.entityId ?? '—'}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-2 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">User</p>
                <p className="mt-0.5 text-[13px] font-bold text-ink">{selected.username ?? 'system'}</p>
                <p className="text-[11px] text-muted">{formatDateTime(selected.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Action</p>
              <StatusPill value={selected.action} tone={actionTone(selected.action)} />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Details</p>
              <pre className="max-h-[50vh] overflow-auto rounded-lg border border-line bg-surface-2 p-3 text-[11px] leading-relaxed text-ink">
                {prettyDetails(selected.details)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
