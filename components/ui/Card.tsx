import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-surface border border-border rounded-2xl shadow-card",
        "px-4 py-4",
        "transition duration-300",
        className
      )}
    >
      {children}
    </section>
  );
}
