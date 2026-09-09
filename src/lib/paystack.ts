// Thin wrapper around Paystack's REST API (no SDK — same hand-rolled-fetch
// approach as the SMS providers in src/lib/notifications/providers/).
// Amounts here are GHS (whole cedis); Paystack's API wants the minor unit
// (pesewas), so conversion happens at the edges of this file only.

const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface InitializeResult {
  ok: boolean;
  authorizationUrl?: string;
  reference?: string;
  error?: string;
}

export async function initializePaystackTransaction(opts: {
  secretKey: string;
  email: string;
  amountGhs: number;
  reference: string;
  callbackUrl: string;
}): Promise<InitializeResult> {
  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: opts.email,
        amount: Math.round(opts.amountGhs * 100),
        reference: opts.reference,
        callback_url: opts.callbackUrl,
        currency: "GHS",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.status) {
      return { ok: false, error: data?.message || `Paystack returned HTTP ${res.status}` };
    }
    return { ok: true, authorizationUrl: data.data?.authorization_url, reference: data.data?.reference };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

interface VerifyResult {
  ok: boolean;
  success?: boolean;
  amountGhs?: number;
  error?: string;
}

export async function verifyPaystackTransaction(opts: { secretKey: string; reference: string }): Promise<VerifyResult> {
  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(opts.reference)}`, {
      headers: { Authorization: `Bearer ${opts.secretKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.status) {
      return { ok: false, error: data?.message || `Paystack returned HTTP ${res.status}` };
    }
    return { ok: true, success: data.data?.status === "success", amountGhs: (data.data?.amount || 0) / 100 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
