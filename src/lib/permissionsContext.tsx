"use client";

// Makes the current admin session's effective permissions (computed once,
// server-side, in admin/layout.tsx) available to client components without
// a separate fetch — AdminShell provides it, any admin page/drawer can read
// it via useAdminPermissions().
import { createContext, useContext } from "react";
import type { PermissionKey } from "./permissions";

const AdminPermissionsContext = createContext<Record<PermissionKey, boolean> | null>(null);

export function AdminPermissionsProvider({
  value,
  children,
}: {
  value: Record<PermissionKey, boolean>;
  children: React.ReactNode;
}) {
  return <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>;
}

// Safe to call from anywhere under AdminShell. Returns all-false outside of
// it (e.g. a component rendered in isolation/tests) rather than throwing.
export function useAdminPermissions(): Record<PermissionKey, boolean> {
  const ctx = useContext(AdminPermissionsContext);
  if (ctx) return ctx;
  return Object.fromEntries(
    (
      [
        "applications",
        "membersView",
        "membersManage",
        "serviceRequests",
        "content",
        "communications",
        "auditLog",
        "reportsMembers",
        "reportsApplications",
        "reportsServiceRequests",
        "dues",
        "settings",
      ] as PermissionKey[]
    ).map((k) => [k, false])
  ) as Record<PermissionKey, boolean>;
}
