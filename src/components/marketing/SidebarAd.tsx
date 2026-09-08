// Vertical promotional banner shown alongside article/profile content on
// News, Events, and Expert detail pages. Hidden on small screens (a tall
// vertical banner has nowhere good to go on mobile) and sticky on desktop
// so it stays in view while the visitor reads.
export function SidebarAd() {
  return (
    <aside className="hidden lg:block" aria-hidden="true">
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 shadow-[var(--shadow-card)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static promotional banner */}
        <img src="/ads/cyber-crime-collective-effort.jpg" alt="" className="w-full" />
      </div>
    </aside>
  );
}
