import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "amber" | "red" | "sky" | "navy";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  accent: "bg-accent-50 text-accent-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  sky: "bg-sky-50 text-sky-700",
  navy: "bg-navy-900/5 text-navy-900",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot,
  pulse,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor(tone), pulse && "signal-dot")} />}
      {children}
    </span>
  );
}

function dotColor(tone: Tone) {
  switch (tone) {
    case "accent":
      return "bg-accent-500";
    case "amber":
      return "bg-amber-500";
    case "red":
      return "bg-red-500";
    case "sky":
      return "bg-sky-500";
    case "navy":
      return "bg-navy-700";
    default:
      return "bg-slate-400";
  }
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "approved":
    case "active":
    case "published":
    case "sent":
    case "resolved":
      return "accent";
    case "pending":
    case "more_info_requested":
    case "draft":
    case "queued":
    case "new":
    case "contacted":
    case "in_progress":
      return "amber";
    case "rejected":
    case "inactive":
    case "failed":
    case "banned":
    case "declined":
      return "red";
    default:
      return "neutral";
  }
}
