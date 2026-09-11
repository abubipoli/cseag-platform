import { headers } from "next/headers";

// x-forwarded-* headers can carry a comma-separated list when a request
// passes through more than one proxy hop (each hop appends its own value)
// — UltraHost's nginx-in-front-of-Apache/Passenger setup does exactly
// this, producing values like "https, https". Only the first hop (the one
// facing the actual client) is meaningful for reconstructing the public
// URL, so always take the first entry.
function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0].trim() || null;
}

// Server components fetching this app's own API routes need an absolute
// URL. Derive it from the incoming request headers so it works in any
// environment (local dev, any port, any production domain) with no
// hardcoded value to keep in sync.
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = firstHeaderValue(h.get("x-forwarded-host")) || h.get("host");
  const protocol = firstHeaderValue(h.get("x-forwarded-proto")) || (host?.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
