import { cn } from "@/lib/cn";

type Tone = "navy" | "accent" | "sky" | "amber" | "red";

const tones: Record<Tone, string> = {
  navy: "from-navy-800 to-navy-600",
  accent: "from-accent-600 to-accent-400",
  sky: "from-sky-500 to-sky-400",
  amber: "from-amber-500 to-amber-400",
  red: "from-red-500 to-red-400",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "navy",
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <div
        className={cn(
          "absolute -right-6 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-10 blur-2xl",
          tones[tone]
        )}
      />
      <div
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
          tones[tone]
        )}
      >
        {icon}
      </div>
      <p className="relative mt-4 text-sm text-slate-500">{label}</p>
      <p className="font-display-light relative mt-1 text-2xl tracking-tight text-navy-900">{value}</p>
      {hint && <p className="relative mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
