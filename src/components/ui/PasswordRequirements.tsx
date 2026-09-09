import { cn } from "@/lib/cn";

// Live checklist matching src/lib/validation.ts#strongPasswordSchema exactly
// — keep both in sync if the policy ever changes.
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 10 characters", test: (v) => v.length >= 10 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One symbol (! @ # $ % ...)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={cn("flex items-center gap-1.5", ok ? "text-accent-700" : "text-slate-400")}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", ok ? "bg-accent-500" : "bg-slate-300")} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export function isStrongPassword(password: string): boolean {
  return RULES.every((rule) => rule.test(password));
}
