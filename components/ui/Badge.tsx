import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "success";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
        "bg-muted/60 border-border text-ink/80",
        tone === "warning" && "bg-amber-50 border-amber-200 text-amber-900/80",
        tone === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900/80",
        className
      )}
    >
      {children}
    </span>
  );
}
