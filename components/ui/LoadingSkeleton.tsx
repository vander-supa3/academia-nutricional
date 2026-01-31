import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-zinc-200 rounded-lg"
          style={{ width: i === lines - 1 && lines > 1 ? "75%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 animate-pulse",
        className
      )}
    >
      <div className="h-4 bg-zinc-200 rounded w-1/3" />
      <div className="h-5 bg-zinc-200 rounded w-2/3 mt-2" />
      <div className="h-3 bg-zinc-200 rounded w-full mt-3" />
      <div className="h-3 bg-zinc-200 rounded w-2/3 mt-2" />
    </div>
  );
}
