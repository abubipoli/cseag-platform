import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "outline-light" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// Pill-shaped controls throughout — the shared signature of both reference
// systems this design draws on (Slash's "pill-shaped controls", Twingate's
// 50px button/badge radius) — kept even after moving to a bright palette.
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-accent-500 text-navy-950 shadow-sm hover:bg-accent-400 hover:shadow-[0_0_20px_-4px_rgba(20,184,113,0.45)]",
  secondary: "bg-navy-900 text-white hover:bg-navy-800",
  outline: "border border-slate-300 text-slate-700 bg-white hover:border-accent-500 hover:text-accent-700",
  "outline-light": "border border-white/30 text-white hover:bg-white/10",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: CommonProps & React.ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
