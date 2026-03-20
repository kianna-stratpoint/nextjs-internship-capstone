/* ============================================
   Centralized Permission Utility
   
   Single source of truth for all RBAC checks.
   Every server action should use requirePermission()
   or hasPermission() instead of inline role checks.
   ============================================ */

import { getUserProjectRole } from "@/lib/db/queries/projects"

/* ==================== TYPES ==================== */

export type MemberRole = "admin" | "contributor" | "viewer"

export type Resource = "project" | "list" | "task" | "member"

export type ProjectAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "archive"
  | "invite"
  | "remove_member"
  | "change_role"

export type ListAction = "create" | "read" | "update" | "reorder" | "delete"

export type TaskAction = "create" | "read" | "update" | "delete" | "move" | "assign" | "comment"

export type MemberAction = "invite" | "remove" | "change_role" | "view"

export type Action = ProjectAction | ListAction | TaskAction | MemberAction

/**
 * Result type for permission checks that don't throw.
 */
export type PermissionResult =
  | { allowed: true; role: MemberRole }
  | { allowed: false; error: string }

/* ==================== PERMISSION MAP ==================== */

/**
 * Static permission matrix.
 * Maps each role to the actions it can perform on each resource.
 *
 * To change what a role can do, edit this constant —
 * every check in the app flows through it.
 */
const PERMISSIONS: Record<MemberRole, Record<Resource, readonly Action[]>> = {
  admin: {
    project: [
      "create",
      "read",
      "update",
      "delete",
      "archive",
      "invite",
      "remove_member",
      "change_role",
    ],
    list: ["create", "read", "update", "reorder", "delete"],
    task: ["create", "read", "update", "delete", "move", "assign", "comment"],
    member: ["invite", "remove", "change_role", "view"],
  },

  contributor: {
    project: ["read"],
    list: ["create", "read", "update", "reorder", "delete"],
    task: ["create", "read", "update", "delete", "move", "assign", "comment"],
    member: ["view"],
  },

  viewer: {
    project: ["read"],
    list: ["read"],
    task: ["read"],
    member: ["view"],
  },
} as const

/* ==================== CORE FUNCTIONS ==================== */

/**
 * Check if a role has permission to perform an action on a resource.
 * Pure function — no DB call, no side effects.
 *
 * @example
 * hasPermission("contributor", "task", "create") // true
 * hasPermission("viewer", "task", "create")      // false
 */
export function hasPermission(role: MemberRole, resource: Resource, action: Action): boolean {
  const allowedActions = PERMISSIONS[role]?.[resource]
  if (!allowedActions) return false
  return (allowedActions as readonly Action[]).includes(action)
}

/**
 * Check permission for a user within a specific project.
 * Fetches the user's role from the DB, then checks the permission map.
 *
 * Returns a discriminated union so callers can handle
 * unauthorized states without try/catch.
 *
 * @example
 * const check = await checkPermission(projectId, userId, "task", "delete")
 * if (!check.allowed) return { success: false, error: check.error }
 */
export async function checkPermission(
  projectId: string,
  userId: string,
  resource: Resource,
  action: Action
): Promise<PermissionResult> {
  const role = await getUserProjectRole(projectId, userId)

  if (!role) {
    return { allowed: false, error: "You are not a member of this project." }
  }

  if (!hasPermission(role as MemberRole, resource, action)) {
    return {
      allowed: false,
      error: `Unauthorized: Your role (${role}) cannot ${action} this ${resource}.`,
    }
  }

  return { allowed: true, role: role as MemberRole }
}

/**
 * Require permission or throw. Use in server actions where you
 * want to bail out early with a returned error object.
 *
 * Returns the user's role on success so callers can use it
 * downstream without a second DB call.
 *
 * @example
 * const { role, error } = await requirePermission(projectId, userId, "member", "invite")
 * if (error) return { success: false, error }
 * // role is guaranteed to be a valid MemberRole here
 */
export async function requirePermission(
  projectId: string,
  userId: string,
  resource: Resource,
  action: Action
): Promise<{ role: MemberRole; error?: never } | { role?: never; error: string }> {
  const result = await checkPermission(projectId, userId, resource, action)

  if (!result.allowed) {
    return { error: result.error }
  }

  return { role: result.role }
}

/* ==================== ROLE HELPERS ==================== */

/**
 * Check if a role is admin.
 */
export function isAdmin(role: MemberRole | string | null): boolean {
  return role === "admin"
}

/**
 * Check if a role can manage members (invite, remove, change roles).
 * Currently only admins can manage members.
 */
export function canManageMembers(role: MemberRole | string | null): boolean {
  if (!role) return false
  return hasPermission(role as MemberRole, "member", "invite")
}

/**
 * Get all allowed actions for a role on a specific resource.
 * Useful for conditionally rendering UI elements.
 *
 * @example
 * const actions = getAllowedActions("contributor", "task")
 * // ["create", "read", "update", "delete", "move", "assign", "comment"]
 */
export function getAllowedActions(role: MemberRole, resource: Resource): readonly Action[] {
  return PERMISSIONS[role]?.[resource] ?? []
}

/**
 * Get the full permission map for a role.
 * Useful for sending to the client to drive UI visibility.
 *
 * @example
 * const perms = getRolePermissions("viewer")
 * // { project: ["read"], list: ["read"], task: ["read"], member: ["view"] }
 */
export function getRolePermissions(role: MemberRole): Record<Resource, readonly Action[]> {
  return PERMISSIONS[role]
}
