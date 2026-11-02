import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const styles = {
  info: "border-border bg-secondary/60 text-secondary-foreground",
  warning: "border-amber-300 bg-amber-50 text-amber-950",
  success: "border-emerald-300 bg-emerald-50 text-emerald-950",
} as const;

const icons = { info: Info, warning: AlertTriangle, success: CheckCircle2 } as const;

export function StatusNote({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: keyof typeof styles;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      className={cn("flex gap-3 rounded-lg border p-4 text-sm", styles[variant], className)}
      role={variant === "warning" ? "status" : undefined}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
