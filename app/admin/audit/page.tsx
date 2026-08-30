import { desc, eq } from "drizzle-orm";
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

export default async function AdminAuditPage() {
  const db = getDb();
  const rows = await db
    .select({
      log: schema.adminAuditLog,
      adminEmail: schema.users.email,
    })
    .from(schema.adminAuditLog)
    .leftJoin(schema.users, eq(schema.adminAuditLog.adminUserId, schema.users.id))
    .orderBy(desc(schema.adminAuditLog.createdAt))
    .limit(200);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="font-serif text-xl">Audit log</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Every editorial and configuration change, newest first.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>By</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ log, adminEmail }) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-[12.5px]">{log.action}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {log.entityType}
                  {log.meta ? (
                    <span className="ml-1.5 text-[11.5px]">
                      {JSON.stringify(log.meta)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-[13px]">{adminEmail ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                  {timeAgo(log.createdAt)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No admin activity logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
