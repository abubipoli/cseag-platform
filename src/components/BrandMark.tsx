import { cn } from "@/lib/cn";

// The real CSEAG shield-and-circuit mark, migrated from
// teams.cyberexpertgh.org (see src/db/seed-experts.ts for the rest of the
// content migration). Native resolution is small (48x53) — the source site
// itself only ever displays it at header-icon size, so this isn't a
// downgrade.
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset, not worth next/image config
    <img src="/brand/cseag-logo.png" alt="CSEAG" className={cn("object-contain", className)} />
  );
}
