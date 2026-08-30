import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  phaseLabel,
  className,
}: {
  status: "draft" | "open" | "closed" | "resolved";
  phaseLabel?: string | null;
  className?: string;
}) {
  const config = {
    draft: { dot: "bg-result-slate", label: "Draft — not published", pulse: false },
    open: { dot: "bg-result-green", label: phaseLabel ?? "Voting open", pulse: true },
    closed: { dot: "bg-result-amber", label: "Voting closed", pulse: false },
    resolved: { dot: "bg-result-blue", label: "Verdict in", pulse: false },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80",
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60 animate-status-pulse",
              config.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dot)} />
      </span>
      {config.label}
    </span>
  );
}
