import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

export function PageHero({
  kicker,
  title,
  description,
  children,
  compact,
  image,
  dark,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  compact?: boolean;
  /** Optional photo shown blurred behind the section, washed out so text stays legible. */
  image?: string;
  /**
   * For moody/dark photos where the default light wash would nearly erase
   * them — darkens the backdrop instead and flips text to white, the same
   * treatment as the home hero.
   */
  dark?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        dark && image ? "bg-navy-950" : "bg-white",
        compact ? "py-14" : "py-24"
      )}
    >
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative blurred backdrop photo */}
          <img
            src={image}
            alt=""
            aria-hidden
            className={cn(
              "animate-ken-burns absolute inset-0 h-full w-full object-cover blur-xs",
              dark ? "opacity-50" : "opacity-80"
            )}
          />
          <div className={cn("absolute inset-0", dark ? "bg-navy-950/55" : "bg-white/60")} aria-hidden />
        </>
      )}
      <div
        className={cn(
          "absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]",
          dark && image ? "bg-grid-dark" : "bg-grid-animate"
        )}
      />
      <div
        className={cn(
          "animate-float-slow absolute -top-24 right-0 h-72 w-72 rounded-full blur-[90px]",
          dark && image ? "bg-accent-500/15" : "bg-accent-100/70"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "animate-float-slow absolute -bottom-24 left-0 h-72 w-72 rounded-full blur-[90px] [animation-delay:-6s]",
          dark && image ? "bg-sky-500/10" : "bg-sky-100/60"
        )}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {kicker && (
          <Reveal>
            <p
              className={cn(
                "text-xs font-bold uppercase tracking-[0.2em]",
                dark && image ? "text-accent-300" : "text-accent-600"
              )}
            >
              {kicker}
            </p>
          </Reveal>
        )}
        <Reveal delay={100}>
          <h1
            className={cn(
              "font-serif-display mt-4",
              dark && image ? "text-white" : "text-navy-900",
              compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl"
            )}
          >
            {title}
          </h1>
        </Reveal>
        {description && (
          <Reveal delay={200}>
            <p
              className={cn(
                "mx-auto mt-5 max-w-2xl text-base sm:text-lg",
                dark && image ? "text-white/75" : "text-slate-500"
              )}
            >
              {description}
            </p>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
