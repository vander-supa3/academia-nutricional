import { ReactNode } from "react";

export function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {icon ? <div className="mt-0.5 text-ink/70">{icon}</div> : null}
        <div>
          <div className="text-sm text-ink/60">{title}</div>
          {subtitle ? <div className="mt-1 font-semibold text-[15px]">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}
