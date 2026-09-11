// Configurable admin-side permissions for the "reviewer" and "admin" roles.
// super_admin is intentionally never stored or checked here — it always has
// every permission, so whoever is configuring this matrix can never lock
// themselves (or every super_admin) out of the system by mistake.
//
// Granting a role or promoting someone to admin/super_admin is deliberately
// NOT part of this matrix — see requireCanAssignRole() below — since that's
// the one action that could let a merely-permissioned "admin" escalate
// their own or someone else's access, which the matrix itself must never
// be able to grant.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings } from "@/db/schema";
import { roleAtLeast, type SessionPayload } from "./auth";
import type { Role } from "@/db/schema";
import { PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS, type PermissionKey, type RolePermissions } from "./permissionKeys";

export { PERMISSION_KEYS, PERMISSION_INFO, DEFAULT_ROLE_PERMISSIONS } from "./permissionKeys";
export type { PermissionKey, RolePermissions } from "./permissionKeys";

const SETTINGS_ID = "singleton";

export async function getRolePermissions(): Promise<RolePermissions> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.id, SETTINGS_ID) });
  if (!row?.rolePermissions) return DEFAULT_ROLE_PERMISSIONS;
  try {
    const stored = JSON.parse(row.rolePermissions) as Partial<RolePermissions>;
    // Merge over the defaults so a newly-added permission key is safely
    // defaulted for existing deployments instead of coming back undefined.
    return {
      reviewer: { ...DEFAULT_ROLE_PERMISSIONS.reviewer, ...stored.reviewer },
      admin: { ...DEFAULT_ROLE_PERMISSIONS.admin, ...stored.admin },
    };
  } catch {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}

export async function updateRolePermissions(permissions: RolePermissions): Promise<void> {
  const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.id, SETTINGS_ID) });
  const update = { rolePermissions: JSON.stringify(permissions), updatedAt: new Date().toISOString() };
  if (existing) {
    await db.update(appSettings).set(update).where(eq(appSettings.id, SETTINGS_ID));
  } else {
    await db.insert(appSettings).values({ id: SETTINGS_ID, ...update });
  }
}

// The single check every admin route/page should use from here on instead
// of a bare roleAtLeast() call. super_admin always passes; applicant/member
// never do (they can't reach the admin panel at all — see admin/layout.tsx).
export async function hasPermission(session: SessionPayload | null, key: PermissionKey): Promise<boolean> {
  if (!session) return false;
  if (roleAtLeast(session.role, "super_admin")) return true;
  if (session.role !== "admin" && session.role !== "reviewer") return false;
  const permissions = await getRolePermissions();
  return permissions[session.role][key];
}

// Every permission this session currently holds — used once per admin page
// load (in admin/layout.tsx) to filter the sidebar, rather than one fetch
// per nav item.
export async function getEffectivePermissions(session: SessionPayload | null): Promise<Record<PermissionKey, boolean>> {
  const empty = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false])) as Record<PermissionKey, boolean>;
  if (!session) return empty;
  if (roleAtLeast(session.role, "super_admin")) {
    return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])) as Record<PermissionKey, boolean>;
  }
  if (session.role !== "admin" && session.role !== "reviewer") return empty;
  const permissions = await getRolePermissions();
  return permissions[session.role];
}

// Assigning admin/super_admin is a hard security boundary, not a
// configurable permission — a merely-permissioned "admin" must never be
// able to grant that same (or higher) access to themselves or anyone else.
// Only a super_admin may do this, matching the account's existing role
// hierarchy rather than the editable matrix above.
export function canAssignRole(session: SessionPayload, targetRole: Role): boolean {
  if (targetRole === "admin" || targetRole === "super_admin") {
    return roleAtLeast(session.role, "super_admin");
  }
  return true;
}
