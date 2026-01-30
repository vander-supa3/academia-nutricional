import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium",
        "transition duration-300 active:scale-[0.99]",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
        variant === "primary" && "bg-primary-500 text-white shadow-card hover:opacity-95",
        variant === "ghost" && "bg-transparent border border-border text-ink hover:bg-muted",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
