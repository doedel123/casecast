import Image from "next/image";
import { ContentWarning } from "@/components/content-warning";
import { SourceList } from "@/components/source-list";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Case, CaseSource } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export function CaseHero({
  caseRow,
  sources,
  action,
}: {
  caseRow: Case;
  sources: CaseSource[];
  action?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[var(--shadow-card-lg)]">
      <div className="relative aspect-[5/3] w-full">
        <Image
          src={caseRow.heroImagePath ?? "/images/case-default.jpg"}
          alt={`Editorial illustration for ${caseRow.title}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
        <Badge className="absolute left-4 top-4 rounded-full border-0 bg-foreground/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-background backdrop-blur">
          {caseRow.categoryLabel}
        </Badge>
      </div>
      <div className="space-y-4 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={caseRow.status} phaseLabel={caseRow.phaseLabel} />
          {action}
        </div>
        <div className="space-y-1.5">
          <h1 className="font-serif text-[1.7rem] leading-tight md:text-4xl">
            {caseRow.title}
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground">
            {caseRow.court}
          </p>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground/80">
          {caseRow.summary}
        </p>
        <ContentWarning text={caseRow.contentWarning} />
        {caseRow.disclaimer && (
          <p className="text-[13px] leading-relaxed text-muted-foreground italic">
            {caseRow.disclaimer}
          </p>
        )}
        <div className="flex flex-col gap-4 border-t border-border/70 pt-4">
          <SourceList sources={sources} />
          <p className="text-[11px] text-muted-foreground">
            Case file updated {formatDate(caseRow.summaryUpdatedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
