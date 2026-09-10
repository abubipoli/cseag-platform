import { cn } from "@/lib/cn";

const PALETTE = [
  "bg-accent-100 text-accent-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-navy-900/10 text-navy-900",
  "bg-rose-100 text-rose-700",
];

function hashColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  photoUrl,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-24 w-24 text-2xl",
    "2xl": "h-36 w-36 text-4xl",
  };

  if (photoUrl) {
    return (
      // Avatar photos are user-uploaded and served from arbitrary local/CDN
      // paths; not worth the next/image remote-pattern config for a small
      // round avatar.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white",
        sizes[size],
        hashColor(name),
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
