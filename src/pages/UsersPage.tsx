import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, ShieldCheck, UserCheck, UserCog, Users } from 'lucide-react'
import { fetchUsers } from '../lib/queries/admin'
import { formatDateTime, formatNumber } from '../lib/format'
import { downloadCsv } from '../lib/download'
import type { UserRow } from '../lib/types'
import Card from '../components/ui/Card'
import DataTable, { type Column } from '../components/ui/DataTable'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { ErrorState } from '../components/ui/States'
import FilterBox from '../components/FilterBox'
import ReadOnlyNotice from '../components/ReadOnlyNotice'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const users = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers })
  const allRows = users.data ?? []

  const roles = useMemo(() => [...new Set(allRows.map((row) => row.role))].sort(), [allRows])

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allRows.filter((row) => {
      if (roleFilter && row.role !== roleFilter) return false
      if (!needle) return true
      return (
        row.username.toLowerCase().includes(needle) ||
        row.fullName.toLowerCase().includes(needle) ||
        (row.email ?? '').toLowerCase().includes(needle) ||
        row.role.toLowerCase().includes(needle)
      )
    })
  }, [allRows, search, roleFilter])

  const activeCount = allRows.filter((row) => row.isActive).length
  const adminCount = allRows.filter((row) => row.role === 'Admin').length

  const columns: Column<UserRow>[] = [
    {
      key: 'user',
      header: 'User',
      sortValue: (row) => row.fullName,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-extrabold text-brand"
          >
            {(row.fullName || row.username).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-ink">{row.fullName || row.username}</p>
            <p className="truncate text-[10px] text-muted">@{row.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortValue: (row) => row.email ?? '',
      render: (row) => <span className="text-[11px] text-muted">{row.email ?? '—'}</span>,
      hideBelow: 'md',
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (row) => row.role,
      render: (row) => <StatusPill value={row.role} tone="info" />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <StatusPill value={row.isActive ? 'Active' : 'Inactive'} tone={row.isActive ? 'ok' : 'neutral'} />
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      align: 'right',
      sortValue: (row) => row.lastLoginAt ?? '',
      render: (row) => (
        <span className="num whitespace-nowrap text-[11px] text-muted">{formatDateTime(row.lastLoginAt)}</span>
      ),
      hideBelow: 'lg',
    },
    {
      key: 'created',
      header: 'Created',
      align: 'right',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="num whitespace-nowrap text-[11px] text-muted">{formatDateTime(row.createdAt)}</span>
      ),
      hideBelow: 'xl',
    },
  ]

  const exportRows = (): void => {
    downloadCsv(
      'users.csv',
      rows.map((row) => ({
        username: row.username,
        fullName: row.fullName,
        email: row.email,
        role: row.role,
        active: row.isActive ? 'Yes' : 'No',
        lastLogin: row.lastLoginAt,
        created: row.createdAt,
      })),
      [
        { key: 'username', label: 'Username' },
        { key: 'fullName', label: 'Full name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'active', label: 'Active' },
        { key: 'lastLogin', label: 'Last login' },
        { key: 'created', label: 'Created' },
      ],
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        subtitle="Accounts, roles and sign-in activity"
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

      <ReadOnlyNotice />

      {users.isError ? (
        <ErrorState
          message={users.error instanceof Error ? users.error.message : 'Could not load users.'}
          onRetry={() => users.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total users"
              value={formatNumber(allRows.length)}
              hint="All accounts"
              tone="brand"
            />
            <StatCard
              icon={UserCheck}
              label="Active"
              value={formatNumber(activeCount)}
              hint="Can sign in"
              tone="ok"
            />
            <StatCard
              icon={ShieldCheck}
              label="Administrators"
              value={formatNumber(adminCount)}
              hint="Admin role"
              tone="amber"
            />
            <StatCard
              icon={UserCog}
              label="Roles in use"
              value={formatNumber(roles.length)}
              hint="Across all accounts"
              tone="teal"
            />
          </div>

          <Card
            title="Accounts"
            subtitle={`${formatNumber(rows.length)} of ${formatNumber(allRows.length)} users`}
            action={
              <div className="flex flex-wrap items-end gap-2">
                <FilterBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name, username or email…"
                  className="w-full sm:w-[220px]"
                />
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  aria-label="Filter by role"
                  className="rounded-lg border border-line bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">All roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
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
              loading={users.isLoading}
              initialSortKey="user"
              initialSortDir="asc"
              pageSize={25}
              emptyTitle="No users match these filters"
              caption="User accounts"
            />
            <p className="mt-3 text-[11px] text-muted">
              Password hashes and salts are intentionally excluded from every query.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
