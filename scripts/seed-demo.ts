/**
 * Demo data for the launch case: tops the vote counts up to a realistic
 * distribution (10,121 total) and seeds five curated discussion comments.
 *
 * All synthetic votes carry an ip_hash starting with "demo" and dedicated
 * anonymous sessions, so they can be removed in one statement before a real
 * public launch:
 *
 *   delete from votes where ip_hash like 'demo%';
 *   delete from anonymous_sessions where user_agent = 'seed-demo';
 *
 * Run with: npm run db:seed-demo   (idempotent — re-runs top up to targets)
 */
import { randomBytes, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { asc, count, eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { loadEnvLocal } from "./env";

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const db = drizzle(neon(url), { schema });

const CASE_SLUG = "commonwealth-v-lindsay-clancy";

// Target distribution — 10,121 total. Leans toward the widely discussed
// criminal-responsibility outcome, with a solid punitive block: plausible for
// a case whose coverage centered on postpartum psychosis.
const TARGETS: Record<string, number> = {
  "First-degree murder": 2429, // 24.0%
  "Second-degree murder": 1316, // 13.0%
  Manslaughter: 911, // 9.0%
  "Not guilty due to lack of criminal responsibility": 4858, // 48.0%
  "Not guilty": 607, // 6.0%
};

const COMMENTS: { authorName: string; body: string; hoursAgo: number }[] = [
  {
    authorName: "veritas_617",
    body: "Day three of deliberations. Quick verdicts favor the prosecution, long ones favor the defense — that's the folk wisdom anyway. Nobody actually knows anything.",
    hoursAgo: 1,
  },
  {
    authorName: "CourtwatcherMA",
    body: "I've followed this case since the arraignment. Forget the closing arguments — read the jury instructions on criminal responsibility. That's where this entire verdict lives.",
    hoursAgo: 3,
  },
  {
    authorName: "jess_quincy",
    body: "Three children are gone. I have real compassion for mental illness, but the verdict still has to say that this mattered. I don't see this jury letting it end quietly.",
    hoursAgo: 5,
  },
  {
    authorName: "rn_mom_of_two",
    body: "My sister survived postpartum psychosis. Most people have no idea how fast it strips away reality. Whatever the jury decides, I hope this trial changes how seriously we take maternal mental health.",
    hoursAgo: 8,
  },
  {
    authorName: "bostonlegalnerd",
    body: "Massachusetts puts the burden on the Commonwealth to prove criminal responsibility beyond a reasonable doubt once the defense raises it. That procedural detail is doing more work here than any single witness.",
    hoursAgo: 11,
  },
];

/** Vote timestamps: ~55% during the deliberation spike (last 3 days), the rest spread over the trial. */
function randomVoteDate(): Date {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const spike = Math.random() < 0.55;
  const offset = spike
    ? Math.random() * 3 * day
    : 3 * day + Math.random() * 15 * day;
  return new Date(now - offset);
}

function demoIpHash(): string {
  return `demo${randomBytes(14).toString("hex")}`;
}

async function main() {
  const [caseRow] = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.slug, CASE_SLUG))
    .limit(1);
  if (!caseRow) {
    console.error(`Case ${CASE_SLUG} not found — run npm run db:seed first.`);
    process.exit(1);
  }

  const outcomes = await db
    .select()
    .from(schema.caseOutcomes)
    .where(eq(schema.caseOutcomes.caseId, caseRow.id))
    .orderBy(asc(schema.caseOutcomes.sortOrder));

  const existing = await db
    .select({ outcomeId: schema.votes.outcomeId, n: count() })
    .from(schema.votes)
    .where(eq(schema.votes.caseId, caseRow.id))
    .groupBy(schema.votes.outcomeId);
  const existingByOutcome = new Map(existing.map((r) => [r.outcomeId, Number(r.n)]));

  // Build the full list of missing votes, then insert in chunks.
  const pending: { outcomeId: string; createdAt: Date }[] = [];
  for (const outcome of outcomes) {
    const target = TARGETS[outcome.label];
    if (target === undefined) {
      console.warn(`! No target for outcome "${outcome.label}" — skipping.`);
      continue;
    }
    const deficit = target - (existingByOutcome.get(outcome.id) ?? 0);
    for (let i = 0; i < deficit; i++) {
      pending.push({ outcomeId: outcome.id, createdAt: randomVoteDate() });
    }
    console.log(
      `  ${outcome.label}: ${existingByOutcome.get(outcome.id) ?? 0} existing, +${Math.max(deficit, 0)} to reach ${target}`,
    );
  }

  const CHUNK = 500;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const chunk = pending.slice(i, i + CHUNK);
    const sessions = chunk.map((v) => ({
      id: randomUUID(),
      ipHash: demoIpHash(),
      userAgent: "seed-demo",
      createdAt: v.createdAt,
    }));
    await db.insert(schema.anonymousSessions).values(sessions);
    await db.insert(schema.votes).values(
      chunk.map((v, j) => ({
        caseId: caseRow.id,
        outcomeId: v.outcomeId,
        anonymousSessionId: sessions[j].id,
        ipHash: sessions[j].ipHash,
        createdAt: v.createdAt,
      })),
    );
    console.log(`  inserted ${Math.min(i + CHUNK, pending.length)}/${pending.length} votes`);
  }

  const [{ n: total }] = await db
    .select({ n: count() })
    .from(schema.votes)
    .where(eq(schema.votes.caseId, caseRow.id));
  console.log(`✓ Vote total for the case: ${Number(total)}`);

  const [{ n: commentCount }] = await db
    .select({ n: count() })
    .from(schema.caseComments)
    .where(eq(schema.caseComments.caseId, caseRow.id));
  if (Number(commentCount) === 0) {
    await db.insert(schema.caseComments).values(
      COMMENTS.map((c) => ({
        caseId: caseRow.id,
        authorName: c.authorName,
        body: c.body,
        createdAt: new Date(Date.now() - c.hoursAgo * 60 * 60 * 1000),
      })),
    );
    console.log(`✓ Seeded ${COMMENTS.length} discussion comments`);
  } else {
    console.log(`✓ Comments already present (${Number(commentCount)})`);
  }

  console.log("\nDemo data complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
