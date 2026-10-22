import type { Metadata } from "next";
import { Avatar } from "@/components/ui/Avatar";
import { IconShieldCheck, IconXCircle } from "@/components/ui/icons";
import { MEMBERSHIP_CATEGORY_LABELS, SITE_CONFIG } from "@/lib/constants";
import { findMemberByToken } from "@/lib/verification";

// A live check of the membership record, so it must never be cached or indexed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Verify membership",
  robots: { index: false, follow: false },
};

export default async function VerifyMemberPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const member = await findMemberByToken(token);
  const checkedAt = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {SITE_CONFIG.fullName}
      </p>
      <h1 className="font-serif-display mt-2 text-center text-2xl text-navy-900">Membership verification</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        {member && member.isActive ? (
          <>
            <div className="flex items-center justify-center gap-2 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-800">
              <IconShieldCheck className="h-5 w-5" /> Verified CSEAG member
            </div>
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <Avatar name={member.fullName} photoUrl={member.photoIsPublic ? member.photoUrl : null} size="xl" />
              <p className="mt-4 text-xl font-bold text-navy-900">
                {member.title ? `${member.title} ` : ""}
                {member.fullName}
              </p>
              <dl className="mt-5 w-full space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Member ID</dt>
                  <dd className="font-mono font-semibold text-navy-900">{member.membershipId || "—"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Membership</dt>
                  <dd className="font-medium text-navy-900">
                    {member.category ? MEMBERSHIP_CATEGORY_LABELS[member.category] || member.category : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold text-accent-700">Active</dd>
                </div>
              </dl>
            </div>
          </>
        ) : member ? (
          <div className="px-6 py-10 text-center">
            <IconXCircle className="mx-auto h-9 w-9 text-amber-600" />
            <p className="mt-3 text-lg font-semibold text-navy-900">Membership not active</p>
            <p className="mt-1 text-sm text-slate-500">
              Member ID <span className="font-mono">{member.membershipId || "—"}</span> is not currently an active CSEAG member.
            </p>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <IconXCircle className="mx-auto h-9 w-9 text-red-600" />
            <p className="mt-3 text-lg font-semibold text-navy-900">Couldn&rsquo;t verify this code</p>
            <p className="mt-1 text-sm text-slate-500">
              This QR code isn&rsquo;t valid or has been replaced. Please ask the member for their current code.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Checked live on {checkedAt} · {SITE_CONFIG.domain}
      </p>
      <p className="mt-1 text-center text-xs text-slate-400">
        Doubts? Call {SITE_CONFIG.phone} or email {SITE_CONFIG.email}.
      </p>
    </div>
  );
}
