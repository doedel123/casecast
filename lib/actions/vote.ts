"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ensureAnonSession } from "@/lib/anon-session";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getViewerVote } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";
import { verifyTurnstile } from "@/lib/turnstile";

const voteSchema = z.object({
  caseId: z.string().uuid(),
  outcomeId: z.string().uuid(),
  turnstileToken: z.string().optional().nullable(),
});

export type VoteActionResult =
  | { ok: true }
  | { ok: false; error: string; alreadyVoted?: boolean };

export async function castVote(
  input: z.infer<typeof voteSchema>,
): Promise<VoteActionResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid vote. Please reload and try again." };
  }
  const { caseId, outcomeId, turnstileToken } = parsed.data;

  const meta = await getRequestMeta();
  if (!rateLimit(`vote:${meta.ipHash}`, { limit: 8, windowMs: 60_000 })) {
    return { ok: false, error: "Too many votes from your network. Please wait a moment." };
  }

  const db = getDb();
  const [caseRow] = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .limit(1);
  if (!caseRow) return { ok: false, error: "This case no longer exists." };
  if (caseRow.status !== "open") {
    return { ok: false, error: "Voting is closed for this case." };
  }

  const [outcome] = await db
    .select()
    .from(schema.caseOutcomes)
    .where(
      and(
        eq(schema.caseOutcomes.id, outcomeId),
        eq(schema.caseOutcomes.caseId, caseId),
      ),
    )
    .limit(1);
  if (!outcome) {
    return { ok: false, error: "That outcome is not available for this case." };
  }

  if (!(await verifyTurnstile(turnstileToken))) {
    return { ok: false, error: "Verification failed. Please try again." };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const anonId = await ensureAnonSession(meta);

  const existing = await getViewerVote(caseId, { userId, anonId });
  if (existing) {
    return {
      ok: false,
      alreadyVoted: true,
      error: "You have already cast your prediction for this case.",
    };
  }

  const inserted = await db
    .insert(schema.votes)
    .values({
      caseId,
      outcomeId,
      userId,
      anonymousSessionId: userId ? null : anonId,
      ipHash: meta.ipHash,
    })
    .onConflictDoNothing()
    .returning({ id: schema.votes.id });

  if (inserted.length === 0) {
    return {
      ok: false,
      alreadyVoted: true,
      error: "You have already cast your prediction for this case.",
    };
  }

  revalidatePath("/");
  revalidatePath(`/cases/${caseRow.slug}`);
  return { ok: true };
}
