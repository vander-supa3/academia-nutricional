import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Algo deu errado",
  message,
  action,
  className,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50/80 px-6 py-6 text-center",
        className
      )}
    >
      <h3 className="font-medium text-red-800">{title}</h3>
      {message && <p className="mt-1 text-sm text-red-700">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
