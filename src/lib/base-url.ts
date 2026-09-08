import { headers } from "next/headers";

// Server components fetching this app's own API routes need an absolute
// URL. Derive it from the incoming request headers so it works in any
// environment (local dev, any port, any production domain) with no
// hardcoded value to keep in sync.
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const protocol = h.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
