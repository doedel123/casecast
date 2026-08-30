import { and, asc, count, desc, eq, inArray, max, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/lib/auth";
import { readAnonSessionId } from "@/lib/anon-session";
import { getDb, schema } from "@/lib/db";
import {
  DEFAULT_DONATION_SETTINGS,
  type DonationSettings,
} from "@/lib/donation";

const {
  cases,
  caseOutcomes,
  caseSources,
  caseResolutions,
  caseComments,
  caseFollows,
  votes,
  subscriptions,
  siteSettings,
  charities,
  donationReports,
} = schema;

export type Viewer = { userId: string | null; anonId: string | null };

export async function getViewer(): Promise<Viewer> {
  const [session, anonId] = await Promise.all([auth(), readAnonSessionId()]);
  return { userId: session?.user?.id ?? null, anonId };
}

export async function getFeaturedCase() {
  const db = getDb();
  const [featured] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.isFeatured, true), ne(cases.status, "draft")))
    .orderBy(desc(cases.updatedAt))
    .limit(1);
  if (featured) return featured;
  const [fallback] = await db
    .select()
    .from(cases)
    .where(eq(cases.status, "open"))
    .orderBy(desc(cases.updatedAt))
    .limit(1);
  return fallback ?? null;
}

export async function getCaseBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(cases)
    .where(eq(cases.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getCaseById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return row ?? null;
}

export async function getCaseOutcomes(caseId: string) {
  return getDb()
    .select()
    .from(caseOutcomes)
    .where(eq(caseOutcomes.caseId, caseId))
    .orderBy(asc(caseOutcomes.sortOrder), asc(caseOutcomes.createdAt));
}

export async function getCaseSources(caseId: string) {
  return getDb()
    .select()
    .from(caseSources)
    .where(eq(caseSources.caseId, caseId))
    .orderBy(asc(caseSources.sortOrder));
}

export async function getCaseComments(caseId: string, limit = 5) {
  return getDb()
    .select()
    .from(caseComments)
    .where(
      and(eq(caseComments.caseId, caseId), eq(caseComments.isPublished, true)),
    )
    .orderBy(desc(caseComments.createdAt))
    .limit(limit);
}

export async function getResolution(caseId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      resolution: caseResolutions,
      outcome: caseOutcomes,
    })
    .from(caseResolutions)
    .innerJoin(caseOutcomes, eq(caseResolutions.outcomeId, caseOutcomes.id))
    .where(eq(caseResolutions.caseId, caseId))
    .limit(1);
  return row ?? null;
}

/** The viewer's own vote on a case — the key that unlocks results. */
export async function getViewerVote(caseId: string, viewer: Viewer) {
  const conds = [];
  if (viewer.userId) conds.push(eq(votes.userId, viewer.userId));
  if (viewer.anonId) conds.push(eq(votes.anonymousSessionId, viewer.anonId));
  if (conds.length === 0) return null;
  const db = getDb();
  const [vote] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.caseId, caseId), or(...conds)))
    .limit(1);
  return vote ?? null;
}

export type ResultRow = {
  outcomeId: string;
  label: string;
  colorKey: string;
  count: number;
  pct: number;
};

export type CaseResults = {
  totalVotes: number;
  lastVoteAt: string | null;
  rows: ResultRow[];
};

/**
 * Aggregated results. Callers MUST verify the viewer has voted (or is an
 * admin) before invoking — results are never rendered or serialized earlier.
 */
export async function getResults(caseId: string): Promise<CaseResults> {
  const db = getDb();
  const [outcomes, counts, [meta]] = await Promise.all([
    getCaseOutcomes(caseId),
    db
      .select({ outcomeId: votes.outcomeId, count: count() })
      .from(votes)
      .where(eq(votes.caseId, caseId))
      .groupBy(votes.outcomeId),
    db
      .select({ total: count(), lastVoteAt: max(votes.createdAt) })
      .from(votes)
      .where(eq(votes.caseId, caseId)),
  ]);
  const byOutcome = new Map(counts.map((c) => [c.outcomeId, Number(c.count)]));
  const total = meta ? Number(meta.total) : 0;

  // Largest-remainder rounding so displayed percentages sum to 100.
  const raw = outcomes.map((o) => {
    const n = byOutcome.get(o.id) ?? 0;
    const exact = total > 0 ? (n / total) * 100 : 0;
    return { o, n, exact, floor: Math.floor(exact) };
  });
  let remainder = total > 0 ? 100 - raw.reduce((s, r) => s + r.floor, 0) : 0;
  const order = [...raw].sort(
    (a, b) => b.exact - b.floor - (a.exact - a.floor),
  );
  const bonus = new Map<string, number>();
  for (const r of order) {
    if (remainder <= 0) break;
    bonus.set(r.o.id, 1);
    remainder -= 1;
  }
  return {
    totalVotes: total,
    lastVoteAt: meta?.lastVoteAt ? new Date(meta.lastVoteAt).toISOString() : null,
    rows: raw.map((r) => ({
      outcomeId: r.o.id,
      label: r.o.label,
      colorKey: r.o.colorKey,
      count: r.n,
      pct: total > 0 ? r.floor + (bonus.get(r.o.id) ?? 0) : 0,
    })),
  };
}

export async function listPublicCases() {
  const db = getDb();
  return db
    .select()
    .from(cases)
    .where(ne(cases.status, "draft"))
    .orderBy(
      sql`case ${cases.status} when 'open' then 0 when 'closed' then 1 else 2 end`,
      desc(cases.isFeatured),
      desc(cases.updatedAt),
    );
}

export async function isMember(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const db = getDb();
  const [row] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ["active", "trialing"]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getSubscription(userId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);
  return row ?? null;
}

const resolvedOutcome = alias(caseOutcomes, "resolved_outcome");

export async function getPredictionHistory(userId: string) {
  const db = getDb();
  return db
    .select({
      vote: votes,
      caseRow: cases,
      outcome: caseOutcomes,
      resolvedOutcome: resolvedOutcome,
      resolvedAt: caseResolutions.resolvedAt,
    })
    .from(votes)
    .innerJoin(cases, eq(votes.caseId, cases.id))
    .innerJoin(caseOutcomes, eq(votes.outcomeId, caseOutcomes.id))
    .leftJoin(caseResolutions, eq(caseResolutions.caseId, cases.id))
    .leftJoin(resolvedOutcome, eq(caseResolutions.outcomeId, resolvedOutcome.id))
    .where(eq(votes.userId, userId))
    .orderBy(desc(votes.createdAt));
}

export function computeAccuracy(
  history: Awaited<ReturnType<typeof getPredictionHistory>>,
) {
  const resolved = history.filter((h) => h.resolvedOutcome);
  const correct = resolved.filter(
    (h) => h.resolvedOutcome && h.vote.outcomeId === h.resolvedOutcome.id,
  );
  return {
    resolvedCount: resolved.length,
    correctCount: correct.length,
    pct:
      resolved.length > 0
        ? Math.round((correct.length / resolved.length) * 100)
        : null,
  };
}

export async function getFollowedCaseIds(userId: string | null) {
  if (!userId) return new Set<string>();
  const rows = await getDb()
    .select({ caseId: caseFollows.caseId })
    .from(caseFollows)
    .where(eq(caseFollows.userId, userId));
  return new Set(rows.map((r) => r.caseId));
}

export async function getFollowedCases(userId: string) {
  return getDb()
    .select({ caseRow: cases, followedAt: caseFollows.createdAt })
    .from(caseFollows)
    .innerJoin(cases, eq(caseFollows.caseId, cases.id))
    .where(eq(caseFollows.userId, userId))
    .orderBy(desc(caseFollows.createdAt));
}

export async function getDonationSettings(): Promise<DonationSettings> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "donation"))
    .limit(1);
  if (!row) return DEFAULT_DONATION_SETTINGS;
  return {
    ...DEFAULT_DONATION_SETTINGS,
    ...(row.value as Partial<DonationSettings>),
  };
}

export async function getActiveCharity() {
  const settings = await getDonationSettings();
  const db = getDb();
  if (settings.charityId) {
    const [row] = await db
      .select()
      .from(charities)
      .where(eq(charities.id, settings.charityId))
      .limit(1);
    if (row) return row;
  }
  const [fallback] = await db
    .select()
    .from(charities)
    .where(eq(charities.isActive, true))
    .orderBy(asc(charities.createdAt))
    .limit(1);
  return fallback ?? null;
}

export async function listCharities() {
  return getDb().select().from(charities).orderBy(asc(charities.createdAt));
}

export async function listDonationReports() {
  return getDb()
    .select({ report: donationReports, charity: charities })
    .from(donationReports)
    .innerJoin(charities, eq(donationReports.charityId, charities.id))
    .orderBy(desc(donationReports.publishedAt));
}
