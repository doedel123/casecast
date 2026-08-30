import { ArrowUpRight } from "lucide-react";
import type { CaseSource } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export function SourceList({ sources }: { sources: CaseSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Sources
      </p>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-start gap-1 text-[13px] leading-snug text-foreground/70 transition-colors hover:text-primary"
            >
              <span>
                <span className="font-medium text-foreground/85 group-hover:text-primary">
                  {s.outlet}
                </span>{" "}
                — {s.title}
                {s.publishedAt && (
                  <span className="text-muted-foreground"> · {formatDate(s.publishedAt)}</span>
                )}
              </span>
              <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
