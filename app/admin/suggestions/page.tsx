import { desc, eq } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSuggestionStatus } from "@/lib/actions/admin";
import { getDb, schema } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-result-amber/15 text-result-amber",
  accepted: "bg-result-green/12 text-result-green",
  declined: "bg-result-slate/15 text-result-slate",
};

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ saved }] = await Promise.all([searchParams]);
  const db = getDb();
  const rows = await db
    .select({ suggestion: schema.caseSuggestions, email: schema.users.email })
    .from(schema.caseSuggestions)
    .leftJoin(schema.users, eq(schema.caseSuggestions.userId, schema.users.id))
    .orderBy(desc(schema.caseSuggestions.createdAt))
    .limit(200);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="font-serif text-xl">Case suggestions</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          Member-submitted case ideas. Accepting is an editorial signal only —
          publishing still happens via “New case”. Referral credit ($1 per new
          member) is granted manually each month via Stripe customer credit.
        </p>
      </div>
      {saved && (
        <p className="rounded-xl border border-result-green/30 bg-result-green/10 px-4 py-2.5 text-[13px] text-foreground/80">
          Saved.
        </p>
      )}
      <ul className="space-y-3">
        {rows.map(({ suggestion: s, email }) => (
          <li
            key={s.id}
            className="rounded-2xl border border-border/80 bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium">{s.caseName}</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {s.court ? `${s.court} · ` : ""}
                  {email ?? "unknown member"} · {timeAgo(s.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  STATUS_STYLE[s.status] ?? STATUS_STYLE.pending,
                )}
              >
                {s.status}
              </span>
            </div>
            {s.reason && (
              <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/75">
                {s.reason}
              </p>
            )}
            {s.sourceUrl && (
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
              >
                Source <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
            {s.status === "pending" && (
              <div className="mt-3 flex gap-2 border-t border-border/70 pt-3">
                <form action={setSuggestionStatus.bind(null, s.id, "accepted")}>
                  <Button size="sm" className="rounded-full px-4">
                    Accept
                  </Button>
                </form>
                <form action={setSuggestionStatus.bind(null, s.id, "declined")}>
                  <Button size="sm" variant="outline" className="rounded-full px-4">
                    Decline
                  </Button>
                </form>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-[13.5px] text-muted-foreground">
            No suggestions yet.
          </li>
        )}
      </ul>
    </div>
  );
}
