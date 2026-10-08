import { MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";

export type SortKey = "date_desc" | "date_asc" | "category" | "id_asc" | "id_desc";

interface Sortable {
  status: string;
  submittedAt: string;
  decisionAt: string | null;
  membershipId: string | null;
  membershipCategory: string;
}

// An approved application is dated by when it was approved; anything else by when it was submitted.
const rowDate = (r: Sortable) => new Date((r.status === "approved" && r.decisionAt) || r.submittedAt).getTime();

// "CSEAG-10125" -> 10125. Members with no ID yet sort to the end either way.
const idNumber = (r: Sortable) => {
  const n = parseInt((r.membershipId || "").replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? null : n;
};

export function sortApplications<T extends Sortable>(list: T[], key: SortKey): T[] {
  const byNewest = (a: T, b: T) => rowDate(b) - rowDate(a);
  return [...list].sort((a, b) => {
    if (key === "date_desc") return byNewest(a, b);
    if (key === "date_asc") return rowDate(a) - rowDate(b);
    if (key === "category") {
      const la = MEMBERSHIP_CATEGORY_LABELS[a.membershipCategory] || a.membershipCategory;
      const lb = MEMBERSHIP_CATEGORY_LABELS[b.membershipCategory] || b.membershipCategory;
      return la.localeCompare(lb) || byNewest(a, b);
    }
    const ia = idNumber(a);
    const ib = idNumber(b);
    if (ia === null && ib === null) return byNewest(a, b);
    if (ia === null) return 1;
    if (ib === null) return -1;
    return key === "id_asc" ? ia - ib : ib - ia;
  });
}
