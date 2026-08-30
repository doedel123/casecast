"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { CaseResults } from "@/lib/queries";
import { cn } from "@/lib/utils";

const FILL: Record<string, string> = {
  blue: "bg-result-blue",
  indigo: "bg-result-indigo",
  green: "bg-result-green",
  amber: "bg-result-amber",
  slate: "bg-result-slate",
};

function updatedLabel(ms: number | null): string {
  if (ms === null) return "Updated just now";
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 50) return "Updated just now";
  const minutes = Math.round(seconds / 60);
  return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

export function ResultsPanel({
  caseId,
  initial,
  viewerOutcomeId,
  resolvedOutcomeId,
  live,
}: {
  caseId: string;
  initial: CaseResults;
  viewerOutcomeId: string | null;
  resolvedOutcomeId?: string | null;
  live: boolean;
}) {
  const [results, setResults] = useState(initial);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/cases/${caseId}/results`, {
          cache: "no-store",
        });
        if (res.ok) {
          setResults(await res.json());
          setFetchedAt(Date.now());
        }
      } catch {
        // Transient network failure — keep showing the last snapshot.
      }
    }, 45_000);
    const tick = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
  }, [caseId, live]);

  return (
    <div className="space-y-4 animate-fade-up">
      <ol className="space-y-3.5">
        {results.rows.map((row, i) => {
          const isYours = row.outcomeId === viewerOutcomeId;
          const isOfficial = row.outcomeId === resolvedOutcomeId;
          return (
            <li key={row.outcomeId} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    "flex flex-wrap items-center gap-1.5 text-[14px] leading-snug",
                    isYours ? "font-semibold text-foreground" : "text-foreground/80",
                  )}
                >
                  {row.label}
                  {isYours && (
                    <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-primary">
                      Your prediction
                    </span>
                  )}
                  {isOfficial && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-result-blue/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-result-blue">
                      <BadgeCheck className="h-3 w-3" /> Official verdict
                    </span>
                  )}
                </p>
                <p
                  className={cn(
                    "text-[15px] font-semibold tabular-nums",
                    isYours ? "text-primary" : "text-foreground/85",
                  )}
                >
                  {row.pct}%
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "animate-result-bar h-full rounded-full transition-[width] duration-700",
                    isYours ? "bg-primary" : (FILL[row.colorKey] ?? FILL.blue),
                  )}
                  style={{
                    width: `${Math.max(row.pct, row.count > 0 ? 2 : 0)}%`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <span>
          {results.totalVotes.toLocaleString("en-US")}{" "}
          {results.totalVotes === 1 ? "prediction" : "predictions"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {live && (
            <span className="h-1.5 w-1.5 rounded-full bg-result-green animate-status-pulse" />
          )}
          {updatedLabel(fetchedAt)}
        </span>
      </div>
    </div>
  );
}
