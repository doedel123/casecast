import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, count, eq } from "drizzle-orm";
import { ExternalLink, Trash2 } from "lucide-react";
import { CaseForm } from "@/components/admin/case-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addOutcome,
  addSource,
  deleteOutcome,
  deleteSource,
  featureCase,
  resolveCase,
  setCaseStatus,
} from "@/lib/actions/admin";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getResolution } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLOR_OPTIONS = ["blue", "indigo", "green", "amber", "slate"] as const;

const selectClass =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default async function EditCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ id }, { error, saved }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = getDb();
  const [caseRow] = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, id))
    .limit(1);
  if (!caseRow) notFound();

  const [outcomes, sources, resolution, voteCounts] = await Promise.all([
    db
      .select()
      .from(schema.caseOutcomes)
      .where(eq(schema.caseOutcomes.caseId, id))
      .orderBy(asc(schema.caseOutcomes.sortOrder)),
    db
      .select()
      .from(schema.caseSources)
      .where(eq(schema.caseSources.caseId, id))
      .orderBy(asc(schema.caseSources.sortOrder)),
    getResolution(id),
    db
      .select({ outcomeId: schema.votes.outcomeId, n: count() })
      .from(schema.votes)
      .where(eq(schema.votes.caseId, id))
      .groupBy(schema.votes.outcomeId),
  ]);
  const votesByOutcome = new Map(voteCounts.map((v) => [v.outcomeId, Number(v.n)]));
  const totalVotes = voteCounts.reduce((s, v) => s + Number(v.n), 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">{caseRow.title}</h2>
          <p className="text-[13px] text-muted-foreground">
            {totalVotes.toLocaleString("en-US")}{" "}
            {totalVotes === 1 ? "vote" : "votes"} · created{" "}
            {formatDate(caseRow.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={caseRow.status} phaseLabel={caseRow.phaseLabel} />
          <Button
            render={<Link href={`/cases/${caseRow.slug}`} target="_blank" />} nativeButton={false}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            Preview <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-xl border border-result-green/30 bg-result-green/10 px-4 py-2.5 text-[13px] text-foreground/80">
          Saved.
        </p>
      )}

      {/* Publishing controls */}
      <section className="rounded-2xl border border-border/80 bg-card p-5">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Publishing
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {caseRow.status !== "open" && caseRow.status !== "resolved" && (
            <form action={setCaseStatus.bind(null, caseRow.id, "open")}>
              <Button size="sm" className="rounded-full" disabled={outcomes.length < 2}>
                Open voting
              </Button>
            </form>
          )}
          {caseRow.status === "open" && (
            <form action={setCaseStatus.bind(null, caseRow.id, "closed")}>
              <Button size="sm" variant="outline" className="rounded-full">
                Close voting now
              </Button>
            </form>
          )}
          {caseRow.status === "closed" && (
            <form action={setCaseStatus.bind(null, caseRow.id, "open")}>
              <Button size="sm" variant="outline" className="rounded-full">
                Reopen voting
              </Button>
            </form>
          )}
          {caseRow.status !== "draft" && totalVotes === 0 && (
            <form action={setCaseStatus.bind(null, caseRow.id, "draft")}>
              <Button size="sm" variant="outline" className="rounded-full">
                Back to draft
              </Button>
            </form>
          )}
          {!caseRow.isFeatured && caseRow.status !== "draft" && (
            <form action={featureCase.bind(null, caseRow.id)}>
              <Button size="sm" variant="outline" className="rounded-full">
                ★ Feature on homepage
              </Button>
            </form>
          )}
        </div>
        {outcomes.length < 2 && (
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Add at least two outcomes before opening the vote.
          </p>
        )}
        {caseRow.votingClosedAt && (
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Voting closed {formatDate(caseRow.votingClosedAt)}.
          </p>
        )}
      </section>

      {/* Case details */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Case details
        </h3>
        <CaseForm caseRow={caseRow} />
      </section>

      {/* Outcomes */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Answer options
        </h3>
        <ul className="mt-3 space-y-2">
          {outcomes.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn("h-3 w-3 shrink-0 rounded-full", {
                    "bg-result-blue": o.colorKey === "blue",
                    "bg-result-indigo": o.colorKey === "indigo",
                    "bg-result-green": o.colorKey === "green",
                    "bg-result-amber": o.colorKey === "amber",
                    "bg-result-slate": o.colorKey === "slate",
                  })}
                />
                <span className="truncate text-[14px] font-medium">{o.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[12.5px] tabular-nums text-muted-foreground">
                  {(votesByOutcome.get(o.id) ?? 0).toLocaleString("en-US")} votes
                </span>
                <form action={deleteOutcome.bind(null, o.id, caseRow.id)}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete outcome ${o.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </li>
          ))}
          {outcomes.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] text-muted-foreground">
              No outcomes yet.
            </li>
          )}
        </ul>
        <form action={addOutcome} className="mt-4 grid gap-2 sm:grid-cols-[1fr_130px_90px_auto]">
          <input type="hidden" name="caseId" value={caseRow.id} />
          <Input name="label" required placeholder="New outcome label" className="h-9" />
          <select name="colorKey" className={selectClass} defaultValue="blue">
            {COLOR_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={outcomes.length}
            className="h-9"
            aria-label="Sort order"
          />
          <Button type="submit" size="sm" className="h-9 rounded-full px-4">
            Add
          </Button>
        </form>
      </section>

      {/* Sources */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Sources
        </h3>
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">
                  {s.outlet} — {s.title}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">{s.url}</p>
              </div>
              <form action={deleteSource.bind(null, s.id, caseRow.id)}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete source ${s.outlet}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </li>
          ))}
          {sources.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] text-muted-foreground">
              No sources yet — every published case needs at least one.
            </li>
          )}
        </ul>
        <form action={addSource} className="mt-4 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="caseId" value={caseRow.id} />
          <Input name="outlet" required placeholder="Outlet (e.g. Associated Press)" className="h-9" />
          <Input name="title" required placeholder="Article title" className="h-9" />
          <Input name="url" type="url" required placeholder="https://…" className="h-9 sm:col-span-2" />
          <Button type="submit" size="sm" className="h-9 w-fit rounded-full px-4">
            Add source
          </Button>
        </form>
      </section>

      {/* Resolution */}
      <section className="rounded-2xl border border-result-blue/25 bg-result-blue/5 p-5 md:p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-result-blue">
          Official outcome
        </h3>
        {resolution ? (
          <p className="mt-2 text-[14px] text-foreground/85">
            Resolved as{" "}
            <span className="font-semibold">{resolution.outcome.label}</span> on{" "}
            {formatDate(resolution.resolution.resolvedAt)}. Submitting again
            overwrites the resolution (logged in the audit trail).
          </p>
        ) : (
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            When the verdict is announced: close voting, then record the
            official outcome. With mixed verdicts across counts, enter the most
            serious verdict returned.
          </p>
        )}
        <form action={resolveCase} className="mt-4 space-y-2.5">
          <input type="hidden" name="caseId" value={caseRow.id} />
          <select name="outcomeId" required className={selectClass} defaultValue={resolution?.outcome.id ?? ""}>
            <option value="" disabled>
              Select the official outcome…
            </option>
            {outcomes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <Input
            name="officialSourceUrl"
            type="url"
            placeholder="Official source URL (court record or major outlet)"
            defaultValue={resolution?.resolution.officialSourceUrl ?? ""}
            className="h-9"
          />
          <Textarea
            name="notes"
            rows={2}
            placeholder="Notes (e.g. verdicts per count)"
            defaultValue={resolution?.resolution.notes ?? ""}
          />
          <Button type="submit" size="sm" variant="outline" className="rounded-full border-result-blue/40 px-4">
            {resolution ? "Update resolution" : "Record verdict & resolve case"}
          </Button>
        </form>
      </section>
    </div>
  );
}
