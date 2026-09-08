import { cn } from "@/lib/cn";

export function PageHero({
  kicker,
  title,
  description,
  children,
  compact,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-white", compact ? "py-14" : "py-24")}>
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent-100/70 blur-[90px]" aria-hidden />
      <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-sky-100/60 blur-[90px]" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {kicker && <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{kicker}</p>}
        <h1
          className={cn(
            "font-serif-display mt-4 text-navy-900",
            compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl"
          )}
        >
          {title}
        </h1>
        {description && <p className="mx-auto mt-5 max-w-2xl text-base text-slate-500 sm:text-lg">{description}</p>}
        {children}
      </div>
    </section>
  );
}
