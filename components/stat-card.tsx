import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-brand-50 text-brand-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
    success: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="card p-4 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <p className="text-2xl font-bold text-ink-900 mt-1">{value}</p>
        {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
      </div>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
