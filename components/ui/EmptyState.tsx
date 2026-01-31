import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-muted/40 px-6 py-8 text-center",
        className
      )}
    >
      {icon && <div className="flex justify-center mb-3 text-zinc-400">{icon}</div>}
      <h3 className="font-medium text-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-600 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
