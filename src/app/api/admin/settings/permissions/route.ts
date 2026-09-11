// GET/PATCH /api/admin/settings/permissions — the editable reviewer/admin
// permission matrix. Deliberately hardcoded to super_admin, NOT gated via
// hasPermission(session, "settings") like the rest of Settings: if an
// "admin" role were ever granted the settings permission, going through the
// shared check here would let them edit the very matrix that controls their
// own access — a privilege-escalation path. See src/lib/permissions.ts.
import { NextRequest, NextResponse } from "next/server";
import { getSession, roleAtLeast } from "@/lib/auth";
import {
  getRolePermissions,
  updateRolePermissions,
  PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
  type RolePermissions,
} from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const permissions = await getRolePermissions();
  return NextResponse.json({ permissions });
}

function isValidRolePermissions(value: unknown): value is RolePermissions {
  if (!value || typeof value !== "object") return false;
  for (const role of ["reviewer", "admin"] as const) {
    const roleGrants = (value as Record<string, unknown>)[role];
    if (!roleGrants || typeof roleGrants !== "object") return false;
    for (const key of PERMISSION_KEYS) {
      if (typeof (roleGrants as Record<string, unknown>)[key] !== "boolean") return false;
    }
  }
  return true;
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!isValidRolePermissions(body)) {
    return NextResponse.json({ error: "Invalid permissions payload" }, { status: 422 });
  }

  // Rebuild from the known key set instead of storing the body verbatim, so
  // an unrecognized extra key can never sneak into what gets persisted.
  const permissions: RolePermissions = {
    reviewer: Object.fromEntries(PERMISSION_KEYS.map((k) => [k, body.reviewer[k]])) as RolePermissions["reviewer"],
    admin: Object.fromEntries(PERMISSION_KEYS.map((k) => [k, body.admin[k]])) as RolePermissions["admin"],
  };

  await updateRolePermissions(permissions);
  await recordAudit({
    actorUserId: session.userId,
    action: "permissions.update",
    targetType: "role_permissions",
    details: permissions,
  });

  return NextResponse.json({ permissions });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await updateRolePermissions(DEFAULT_ROLE_PERMISSIONS);
  await recordAudit({ actorUserId: session.userId, action: "permissions.reset", targetType: "role_permissions" });

  return NextResponse.json({ permissions: DEFAULT_ROLE_PERMISSIONS });
}
