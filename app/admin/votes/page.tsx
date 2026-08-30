import { count, countDistinct, desc, max, sql } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb, schema } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminVotesPage() {
  const db = getDb();
  const { votes } = schema;
  const clusters = await db
    .select({
      ipHash: votes.ipHash,
      voteCount: count(),
      sessionCount: countDistinct(votes.anonymousSessionId),
      userCount: countDistinct(votes.userId),
      caseCount: countDistinct(votes.caseId),
      lastAt: max(votes.createdAt),
    })
    .from(votes)
    .where(sql`${votes.createdAt} >= now() - interval '7 days'`)
    .groupBy(votes.ipHash)
    .having(sql`count(*) >= 3`)
    .orderBy(desc(count()))
    .limit(100);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="font-serif text-xl">Vote review</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          Network clusters with 3+ votes in the last 7 days, grouped by salted
          IP hash. Many votes from one hash across few cases but many sessions
          can indicate coordinated voting — shared networks (offices, campuses)
          also look like this, so review before acting.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP hash</TableHead>
              <TableHead className="text-right">Votes</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Accounts</TableHead>
              <TableHead className="text-right">Cases</TableHead>
              <TableHead>Last vote</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clusters.map((c) => {
              const suspicious =
                Number(c.voteCount) >= 5 &&
                Number(c.caseCount) <= 2 &&
                Number(c.sessionCount) >= 3;
              return (
                <TableRow key={c.ipHash ?? "unknown"}>
                  <TableCell className="font-mono text-[12px]">
                    {c.ipHash?.slice(0, 16) ?? "—"}
                    {suspicious && (
                      <span className="ml-2 rounded-full bg-result-amber/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase text-result-amber">
                        Review
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(c.voteCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(c.sessionCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(c.userCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(c.caseCount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {c.lastAt ? timeAgo(c.lastAt) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {clusters.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nothing to review — no network cast 3+ votes this week.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
