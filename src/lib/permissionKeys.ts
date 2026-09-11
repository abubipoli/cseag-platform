// Pure constants/types for the admin permission matrix — no DB or server
// imports, so this is safe to import from client components (unlike
// permissions.ts, which pulls in the DB client and would otherwise get
// bundled into the browser build). permissions.ts re-exports all of this
// for server-side callers.
export const PERMISSION_KEYS = [
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
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type RolePermissions = Record<"reviewer" | "admin", Record<PermissionKey, boolean>>;

export const PERMISSION_INFO: Record<PermissionKey, { module: string; label: string; description: string }> = {
  applications: {
    module: "Applications",
    label: "Review applications",
    description: "View the applicant queue and approve, reject, or request more info.",
  },
  membersView: {
    module: "Members",
    label: "View members & edit basic details",
    description: "View the member list/detail, plus update phone, category, and reset a password.",
  },
  membersManage: {
    module: "Members",
    label: "Manage member accounts",
    description: "Create accounts, change role or active status, change email, and reset 2FA.",
  },
  serviceRequests: {
    module: "Service Requests",
    label: "Manage service requests",
    description: "View, assign, and update the status of expert service-request tickets.",
  },
  content: {
    module: "Content",
    label: "Manage content",
    description: "Create, edit, and publish news, events, and resources.",
  },
  communications: {
    module: "Communications",
    label: "Send communications",
    description: "View the notification log, send broadcasts, and resend failed deliveries.",
  },
  auditLog: {
    module: "Audit Log",
    label: "View audit log",
    description: "See every recorded admin action.",
  },
  reportsMembers: {
    module: "Reports",
    label: "Export member report",
    description: "Download the member list report (CSV/Excel/PDF).",
  },
  reportsApplications: {
    module: "Reports",
    label: "Export applications report",
    description: "Download the applications report.",
  },
  reportsServiceRequests: {
    module: "Reports",
    label: "Export service requests report",
    description: "Download the service-requests report.",
  },
  dues: {
    module: "Dues",
    label: "Manage membership dues",
    description: "View every member's dues status, record manual payments, and export the dues report. Financial data.",
  },
  settings: {
    module: "Settings",
    label: "Manage settings",
    description:
      "General settings, notification templates, and live credentials (SMTP/SMS/Paystack keys). Highly sensitive.",
  },
};

// Mirrors exactly what each role could already do before this matrix existed
// (see the roleAtLeast checks this replaces), so introducing it changes
// nothing for anyone until a super_admin deliberately edits it.
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  reviewer: {
    applications: true,
    membersView: true,
    membersManage: false,
    serviceRequests: true,
    content: false,
    communications: false,
    auditLog: false,
    reportsMembers: false,
    reportsApplications: false,
    reportsServiceRequests: true,
    dues: false,
    settings: false,
  },
  admin: {
    applications: true,
    membersView: true,
    membersManage: true,
    serviceRequests: true,
    content: true,
    communications: true,
    auditLog: true,
    reportsMembers: true,
    reportsApplications: true,
    reportsServiceRequests: true,
    dues: false,
    settings: false,
  },
};
