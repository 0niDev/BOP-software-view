/**
 * Read-only administration data. Only non-sensitive columns are selected:
 * `users.password_hash` and `users.password_salt` are never requested.
 */
import { query } from '../sqlitecloud'
import type { AuditRow, RoleRow, SettingRow, UserRow } from '../types'

export async function fetchUsers(): Promise<UserRow[]> {
  const rows = await query<{
    id: number
    username: string
    fullName: string
    email: string | null
    role: string | null
    isActive: number
    lastLoginAt: string | null
    createdAt: string
  }>(
    `SELECT u.id, u.username, u.full_name AS fullName, u.email,
            r.name AS role, u.is_active AS isActive,
            u.last_login_at AS lastLoginAt, u.created_at AS createdAt
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     ORDER BY u.username`,
  )

  return rows.map((row) => ({
    ...row,
    role: row.role ?? '—',
    isActive: row.isActive === 1,
  }))
}

export async function fetchRoles(): Promise<RoleRow[]> {
  const [roles, grants] = await Promise.all([
    query<{ id: number; name: string; description: string | null }>(
      `SELECT id, name, description FROM roles ORDER BY name`,
    ),
    query<{ roleId: number; code: string; description: string | null }>(
      `SELECT rp.role_id AS roleId, p.code, p.description
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       ORDER BY rp.role_id, p.code`,
    ),
  ])

  return roles.map((role) => {
    const permissions = grants
      .filter((grant) => grant.roleId === role.id)
      .map((grant) => grant.code)
    return {
      ...role,
      permissionCount: permissions.length,
      permissions,
    }
  })
}

export async function fetchSettings(): Promise<SettingRow[]> {
  const rows = await query<{ group: string; key: string; value: string | null }>(
    `SELECT setting_group AS "group", setting_key AS key, setting_value AS value
     FROM settings
     ORDER BY setting_group, setting_key`,
  )
  return rows
}

export async function fetchAuditLog(): Promise<AuditRow[]> {
  const rows = await query<{
    id: number
    action: string
    entityTable: string
    entityId: number | null
    details: string | null
    createdAt: string
    username: string | null
  }>(
    `SELECT al.id, al.action, al.entity_table AS entityTable, al.entity_id AS entityId,
            al.details, al.created_at AS createdAt, u.username
     FROM audit_log al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC, al.id DESC
     LIMIT 250`,
  )
  return rows
}
