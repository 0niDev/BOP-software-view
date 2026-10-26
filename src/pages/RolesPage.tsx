import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react'
import { fetchRoles, fetchUsers } from '../lib/queries/admin'
import { formatNumber } from '../lib/format'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusPill from '../components/ui/StatusPill'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import FilterBox from '../components/FilterBox'
import ReadOnlyNotice from '../components/ReadOnlyNotice'

export default function RolesPage() {
  const [search, setSearch] = useState('')

  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: fetchRoles })
  const users = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers })

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const all = roles.data ?? []
    if (!needle) return all
    return all.filter(
      (role) =>
        role.name.toLowerCase().includes(needle) ||
        (role.description ?? '').toLowerCase().includes(needle) ||
        role.permissions.some((permission) => permission.toLowerCase().includes(needle)),
    )
  }, [roles.data, search])

  const userCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const user of users.data ?? []) counts.set(user.role, (counts.get(user.role) ?? 0) + 1)
    return counts
  }, [users.data])

  const allRoles = roles.data ?? []
  const rolesWithPermissions = allRoles.filter((role) => role.permissionCount > 0).length
  const assignedUsers = (users.data ?? []).length
  const unassignedRoles = allRoles.filter((role) => !userCounts.has(role.name)).length
  const permissionTotal = allRoles.reduce((sum, role) => sum + role.permissionCount, 0)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Administration"
        title="Roles"
        subtitle="Role definitions, module permissions and account assignment"
      />

      <ReadOnlyNotice title="Read-only roles & permissions">
        Role membership and permission grants are shown for audit only. Changes must be made in the
        desktop ERP, not this viewer.
      </ReadOnlyNotice>

      {roles.isError ? (
        <ErrorState
          message={roles.error instanceof Error ? roles.error.message : 'Could not load roles.'}
          onRetry={() => roles.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              label="Roles"
              value={formatNumber(allRoles.length)}
              hint="Defined in the ERP"
              tone="brand"
            />
            <StatCard
              icon={KeyRound}
              label="Permission grants"
              value={formatNumber(permissionTotal)}
              hint={`Across ${formatNumber(rolesWithPermissions)} role(s)`}
              tone="teal"
            />
            <StatCard
              icon={Users}
              label="Assigned users"
              value={formatNumber(assignedUsers)}
              hint="Accounts with a role"
              tone="ok"
            />
            <StatCard
              icon={UserCog}
              label="Unassigned roles"
              value={formatNumber(unassignedRoles)}
              hint="No user account uses the role"
              tone={unassignedRoles > 0 ? 'amber' : 'ok'}
            />
          </div>

          <Card
            title="Role catalogue"
            subtitle={`${formatNumber(rows.length)} of ${formatNumber(allRoles.length)} roles`}
            action={
              <FilterBox
                value={search}
                onChange={setSearch}
                placeholder="Search role or permission…"
                className="w-[240px]"
              />
            }
          >
            {roles.isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState title="No roles match this search" />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {rows.map((role) => {
                  const assigned = userCounts.get(role.name) ?? 0
                  return (
                    <article key={role.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-extrabold text-ink">{role.name}</h3>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                            {role.description || 'No description'}
                          </p>
                        </div>
                        <StatusPill
                          tone={role.permissionCount > 0 ? 'ok' : 'neutral'}
                        >
                          {formatNumber(role.permissionCount)} permission{role.permissionCount === 1 ? '' : 's'}
                        </StatusPill>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Users size={13} aria-hidden />
                          {formatNumber(assigned)} user{assigned === 1 ? '' : 's'}
                        </span>
                        <span className="text-line-strong">·</span>
                        <span>ID {role.id}</span>
                      </div>

                      {role.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-md border border-dashed border-line px-2.5 py-2 text-[11px] text-muted">
                          No explicit permission rows are stored for this role.
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
