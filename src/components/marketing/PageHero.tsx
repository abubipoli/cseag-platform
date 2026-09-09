import { cn } from "@/lib/cn";

export function PageHero({
  kicker,
  title,
  description,
  children,
  compact,
  image,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  compact?: boolean;
  /** Optional photo shown blurred behind the section, washed out so text stays legible. */
  image?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-white", compact ? "py-14" : "py-24")}>
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative blurred backdrop photo */}
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-md"
          />
          <div className="absolute inset-0 bg-white/78" aria-hidden />
        </>
      )}
      <div className="bg-grid-animate absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="animate-float-slow absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent-100/70 blur-[90px]" aria-hidden />
      <div
        className="animate-float-slow absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-sky-100/60 blur-[90px] [animation-delay:-6s]"
        aria-hidden
      />
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
