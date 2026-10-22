import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/cn";

// Shown by the route-level loading.tsx files while a page is fetching its data.
export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4", className)}>
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-4 border-accent-100" />
        <div className="loader-ring absolute inset-0 rounded-full border-4 border-transparent border-t-accent-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BrandMark className="loader-logo h-10 w-9" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-navy-900">Loading…</p>
        <p className="mt-1 text-xs text-slate-500">Cyber Security Experts Association of Ghana</p>
      </div>
      <div className="loader-bar h-1 w-40 overflow-hidden rounded-full bg-slate-200">
        <span className="block h-full w-2/5 rounded-full bg-accent-500" />
      </div>
    </div>
  );
}
