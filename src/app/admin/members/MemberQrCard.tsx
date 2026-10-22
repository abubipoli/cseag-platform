"use client";

// Admin-side membership QR: scanning it opens the public /verify page, which
// checks the member's live record. The code is created on first view.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconExternalLink } from "@/components/ui/icons";

interface QrData {
  verifyUrl: string;
  qrDataUrl: string;
  membershipId: string | null;
}

export function MemberQrCard({ memberId, canRegenerate }: { memberId: string; canRegenerate: boolean }) {
  const [data, setData] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/admin/members/${memberId}/qr`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d: QrData) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("Couldn't load the QR code."));
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  async function regenerate() {
    if (
      !window.confirm(
        "Issue a new QR code for this member? Any QR code already printed or shared for them will stop working."
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/members/${memberId}/qr`, { method: "POST" });
    setBusy(false);
    if (res.ok) setData(await res.json());
    else setError("Couldn't issue a new code.");
  }

  async function copyLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the link is also shown on screen */
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">Membership QR code</p>
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : !data ? (
        <p className="mt-2 text-sm text-slate-400">Preparing…</p>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- locally generated data: URI */}
          <img src={data.qrDataUrl} alt="Membership QR code" className="h-40 w-40 shrink-0 rounded-lg border border-slate-100" />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm text-slate-600">
              Scanning this opens CSEAG&rsquo;s public verification page, which confirms this member&rsquo;s details live.
            </p>
            <p className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-500">{data.verifyUrl}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <a
                href={data.qrDataUrl}
                download={`${data.membershipId || "member"}-qr.png`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent-500 hover:text-accent-700"
              >
                Download PNG
              </a>
              <Button variant="outline" size="sm" onClick={copyLink} type="button">
                {copied ? "Copied" : "Copy link"}
              </Button>
              <a
                href={data.verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent-500 hover:text-accent-700"
              >
                Test scan <IconExternalLink className="h-3.5 w-3.5" />
              </a>
              {canRegenerate && (
                <Button variant="ghost" size="sm" onClick={regenerate} disabled={busy} type="button">
                  {busy ? "Working…" : "Issue new code"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
