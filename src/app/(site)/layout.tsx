import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/auth";
import { recordVisit } from "@/lib/analytics";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Using headers() here is deliberate, not incidental: it's what forces
  // this layout to render fresh on every navigation instead of being
  // reused from the client-side Router Cache — see middleware.ts for why
  // the actual path/IP have to be forwarded this way rather than read
  // directly here (this component runs in full Node.js; middleware
  // doesn't, and can't do the DB write or session decoding itself).
  const h = await headers();
  const path = h.get("x-visit-path");
  if (path) {
    const session = await getSession();
    recordVisit({
      path,
      ip: h.get("x-visit-ip") || null,
      userAgent: h.get("user-agent"),
      referrer: h.get("referer"),
      userId: session?.userId,
    });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
