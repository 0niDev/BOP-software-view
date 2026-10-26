import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Monitor, Settings as SettingsIcon, SlidersHorizontal } from 'lucide-react'
import { fetchSettings } from '../lib/queries/admin'
import { formatNumber, titleCase } from '../lib/format'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import FilterBox from '../components/FilterBox'
import ReadOnlyNotice from '../components/ReadOnlyNotice'

interface Shortcut {
  action_id?: string
  default_sequence?: string
  current_sequence?: string
  description?: string
  context?: string
  category?: string
}

function parseShortcut(value: string | null): Shortcut | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Shortcut
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function isSensitiveKey(key: string): boolean {
  return /(password|secret|token|api[_-]?key|salt|hash)/i.test(key)
}

function mask(value: string | null): string {
  if (value == null) return '—'
  if (value.length <= 6) return '••••••'
  return `${value.slice(0, 2)}••••••${value.slice(-2)}`
}

function readableKey(key: string): string {
  return titleCase(key.replace(/[.:_-]+/g, ' '))
}

export default function SettingsPage() {
  const [search, setSearch] = useState('')
  const settings = useQuery({ queryKey: ['admin-settings'], queryFn: fetchSettings })

  const { groups, shortcuts } = useMemo(() => {
    const all = settings.data ?? []
    const grouped = new Map<string, typeof all>()
    const shortcutRows: Shortcut[] = []

    for (const row of all) {
      if (row.group === 'SHORTCUTS') {
        const parsed = parseShortcut(row.value)
        if (parsed) shortcutRows.push(parsed)
        continue
      }
      const bucket = grouped.get(row.group) ?? []
      bucket.push(row)
      grouped.set(row.group, bucket)
    }

    return { groups: [...grouped.entries()], shortcuts: shortcutRows }
  }, [settings.data])

  const needle = search.trim().toLowerCase()

  const visibleGroups = groups
    .map(([group, rows]) => ({
      group,
      rows: needle
        ? rows.filter(
            (row) =>
              group.toLowerCase().includes(needle) ||
              row.key.toLowerCase().includes(needle) ||
              (row.value ?? '').toLowerCase().includes(needle),
          )
        : rows,
    }))
    .filter((entry) => entry.rows.length > 0)

  const visibleShortcuts = needle
    ? shortcuts.filter((shortcut) =>
        [shortcut.description, shortcut.current_sequence, shortcut.default_sequence, shortcut.category, shortcut.context]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle)),
      )
    : shortcuts

  const settingCount = (settings.data ?? []).filter((row) => row.group !== 'SHORTCUTS').length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        subtitle="Appearance, application preferences and keyboard shortcuts"
      />

      <ReadOnlyNotice title="Read-only settings">
        Configuration is displayed exactly as stored. Sensitive-looking values are masked. Changes must be
        made in the desktop ERP.
      </ReadOnlyNotice>

      {settings.isError ? (
        <ErrorState
          message={settings.error instanceof Error ? settings.error.message : 'Could not load settings.'}
          onRetry={() => settings.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={SettingsIcon}
              label="Settings"
              value={formatNumber(settingCount)}
              hint="Non-shortcut preferences"
              tone="brand"
            />
            <StatCard
              icon={SlidersHorizontal}
              label="Shortcuts"
              value={formatNumber(shortcuts.length)}
              hint="Configured key bindings"
              tone="teal"
            />
            <StatCard
              icon={Monitor}
              label="Groups"
              value={formatNumber(groups.length)}
              hint="Distinct setting groups"
              tone="ok"
            />
          </div>

          <Card
            title="Configuration"
            subtitle={`${formatNumber(visibleGroups.reduce((sum, entry) => sum + entry.rows.length, 0))} settings`}
            action={
              <FilterBox
                value={search}
                onChange={setSearch}
                placeholder="Search settings or shortcuts…"
                className="w-full sm:w-[240px]"
              />
            }
          >
            {settings.isLoading ? (
              <Skeleton className="h-56 rounded-lg" />
            ) : visibleGroups.length === 0 && visibleShortcuts.length === 0 ? (
              <EmptyState title="No settings match this search" />
            ) : (
              <div className="flex flex-col gap-6">
                {visibleGroups.map(({ group, rows }) => (
                  <section key={group}>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                      {titleCase(group)}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-line">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th scope="col">Setting</th>
                            <th scope="col">Key</th>
                            <th scope="col" className="text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.key}>
                              <td className="text-[13px] font-semibold text-ink">{readableKey(row.key)}</td>
                              <td className="num text-[11px] text-muted">{row.key}</td>
                              <td className="max-w-[360px] text-right">
                                <span
                                  className="num inline-block truncate align-middle text-[12px] font-semibold text-ink"
                                  title={isSensitiveKey(row.key) ? undefined : (row.value ?? undefined)}
                                >
                                  {isSensitiveKey(row.key) ? mask(row.value) : (row.value ?? '—')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}

                {visibleShortcuts.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                      Keyboard shortcuts
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-line">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th scope="col">Action</th>
                            <th scope="col">Category</th>
                            <th scope="col">Context</th>
                            <th scope="col" className="text-right">Current</th>
                            <th scope="col" className="text-right">Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleShortcuts.map((shortcut) => (
                            <tr key={shortcut.action_id ?? shortcut.description}>
                              <td className="text-[12px] font-semibold text-ink">
                                {shortcut.description ?? readableKey(shortcut.action_id ?? '')}
                              </td>
                              <td className="text-[11px] text-muted">{shortcut.category ?? '—'}</td>
                              <td className="text-[11px] text-muted">{shortcut.context ?? '—'}</td>
                              <td className="text-right">
                                <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                                  {shortcut.current_sequence ?? '—'}
                                </kbd>
                              </td>
                              <td className="text-right">
                                <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                                  {shortcut.default_sequence ?? '—'}
                                </kbd>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
