"use client";

// Super_admin-only screen for deciding exactly what the "reviewer" and
// "admin" roles can do in the admin panel, module by module. Assigning the
// admin/super_admin role itself is NOT here — that's a separate, hardcoded
// security boundary (see canAssignRole() in src/lib/permissions.ts) that
// this matrix can never be used to grant.
import { Fragment, useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PERMISSION_KEYS, PERMISSION_INFO, type PermissionKey, type RolePermissions } from "@/lib/permissionKeys";

const ROLES: { key: "reviewer" | "admin"; label: string }[] = [
  { key: "reviewer", label: "Reviewer" },
  { key: "admin", label: "Admin" },
];

function groupByModule(): Record<string, PermissionKey[]> {
  const groups: Record<string, PermissionKey[]> = {};
  for (const key of PERMISSION_KEYS) {
    const mod = PERMISSION_INFO[key].module;
    (groups[mod] ||= []).push(key);
  }
  return groups;
}

const MODULE_GROUPS = groupByModule();

export default function RolePermissionsForm() {
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/settings/permissions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { permissions: RolePermissions } | null) => {
        if (d) setPermissions(d.permissions);
      });
  }

  useEffect(load, []);

  function toggle(role: "reviewer" | "admin", key: PermissionKey) {
    setPermissions((prev) => (prev ? { ...prev, [role]: { ...prev[role], [key]: !prev[role][key] } } : prev));
  }

  async function handleSave() {
    if (!permissions) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings/permissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(permissions),
    });
    setSaving(false);
    setMessage(res.ok ? "Permissions saved." : "Couldn't save permissions. Try again.");
  }

  async function handleReset() {
    if (!confirm("Reset reviewer and admin permissions back to the original defaults?")) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings/permissions", { method: "DELETE" });
    const data = res.ok ? await res.json() : null;
    setSaving(false);
    if (data) {
      setPermissions(data.permissions);
      setMessage("Permissions reset to defaults.");
    } else {
      setMessage("Couldn't reset permissions. Try again.");
    }
  }

  if (!permissions) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-400">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardBody className="space-y-6">
          <div>
            <h3 className="font-semibold text-navy-900">Roles & permissions</h3>
            <p className="text-sm text-slate-500">
              Decide exactly what reviewers and admins can do in the admin panel. Super admins always have full
              access and aren&rsquo;t affected by this. Changes apply the next time each person loads a page.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="w-1/2 py-2 pr-4 font-medium">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r.key} className="w-1/4 py-2 text-center font-medium">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(MODULE_GROUPS).map(([module, keys]) => (
                  <Fragment key={module}>
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {module}
                      </td>
                    </tr>
                    {keys.map((key) => (
                      <tr key={key} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-navy-900">{PERMISSION_INFO[key].label}</p>
                          <p className="text-xs text-slate-500">{PERMISSION_INFO[key].description}</p>
                        </td>
                        {ROLES.map((r) => (
                          <td key={r.key} className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[r.key][key]}
                              onChange={() => toggle(r.key, key)}
                              className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500/30"
                              aria-label={`${r.label}: ${PERMISSION_INFO[key].label}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {message && <p className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">{message}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          Reset to defaults
        </button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save permissions"}
        </Button>
      </div>
    </>
  );
}
