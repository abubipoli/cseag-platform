// Idle-timeout enforcement (SRS 7.1 security hardening): logs a member or
// admin out after a stretch of inactivity, even though the session JWT
// itself is valid for up to 12 hours (see SESSION_TTL_SECONDS in lib/auth).
//
// Runs on every request, but is a no-op for anyone without a session cookie
// (i.e. all public/anonymous traffic), so there's no need to hand-maintain a
// list of "protected" paths here — it naturally only ever acts on logged-in
// requests.
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "cseag_session";
const LAST_SEEN_COOKIE = "cseag_last_seen";
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const COOKIE_MAX_AGE = 60 * 60 * 12; // matches the session JWT's own ceiling

// Paystack redirects the browser here after checkout, which can easily
// take longer than the idle window (entering card/mobile-money details,
// waiting on an OTP). The payment must still be verified and recorded even
// if the member's session has gone idle in the meantime — see the route
// itself for the matching fix (it doesn't hard-require a live session
// either, as defense in depth).
const IDLE_EXEMPT_PATHS = ["/api/member/dues/verify"];

export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.next();
  if (IDLE_EXEMPT_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))) return NextResponse.next();

  const lastSeenRaw = req.cookies.get(LAST_SEEN_COOKIE)?.value;
  const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null;
  const now = Date.now();

  if (lastSeen && Number.isFinite(lastSeen) && now - lastSeen > IDLE_TIMEOUT_MS) {
    const isApi = req.nextUrl.pathname.startsWith("/api/");
    const res = isApi
      ? NextResponse.json({ error: "Your session expired due to inactivity. Please log in again." }, { status: 401 })
      : NextResponse.redirect(new URL("/login?reason=idle", req.url));
    res.cookies.delete(SESSION_COOKIE);
    res.cookies.delete(LAST_SEEN_COOKIE);
    return res;
  }

  const res = NextResponse.next();
  res.cookies.set(LAST_SEEN_COOKIE, String(now), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)"],
};
