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
        "transition duration-300",
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("px-4 py-4", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-t border-border bg-muted/30 rounded-b-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}
