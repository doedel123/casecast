import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { Plus, Star } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const db = getDb();
  const rows = await db
    .select({
      caseRow: schema.cases,
      voteCount: count(schema.votes.id),
    })
    .from(schema.cases)
    .leftJoin(schema.votes, eq(schema.votes.caseId, schema.cases.id))
    .groupBy(schema.cases.id)
    .orderBy(desc(schema.cases.updatedAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] text-muted-foreground">
          {rows.length} {rows.length === 1 ? "case" : "cases"} · the starred
          case is featured on the homepage
        </p>
        <Button
          render={<Link href="/admin/cases/new" />} nativeButton={false}
          size="sm"
          className="rounded-full"
        >
          <Plus className="h-4 w-4" /> New case
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Votes</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ caseRow, voteCount }) => (
              <TableRow key={caseRow.id}>
                <TableCell className="max-w-[320px]">
                  <div className="flex items-center gap-1.5">
                    {caseRow.isFeatured && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-result-amber text-result-amber" />
                    )}
                    <span className="truncate font-medium">{caseRow.title}</span>
                  </div>
                  <p className="truncate text-[12px] text-muted-foreground">
                    /cases/{caseRow.slug}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={caseRow.status}
                    phaseLabel={caseRow.phaseLabel}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {Number(voteCount).toLocaleString("en-US")}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(caseRow.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    render={<Link href={`/admin/cases/${caseRow.id}`} />} nativeButton={false}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No cases yet — create the first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
