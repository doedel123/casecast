"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import type { DonationSettings } from "@/lib/donation";

async function audit(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  meta?: Record<string, unknown>,
) {
  await getDb().insert(schema.adminAuditLog).values({
    adminUserId,
    action,
    entityType,
    entityId,
    meta: meta ?? null,
  });
}

function revalidateCase(slug?: string | null) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/cases/${slug}`);
}

const caseSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case"),
  title: z.string().trim().min(3).max(200),
  court: z.string().trim().min(2).max(200),
  categoryLabel: z.string().trim().min(2).max(60).default("Live Case"),
  question: z.string().trim().min(10).max(300),
  summary: z.string().trim().min(20).max(1200),
  disclaimer: z.string().trim().max(600).optional(),
  contentWarning: z.string().trim().max(300).optional(),
  heroImagePath: z.string().trim().max(400).optional(),
  phaseLabel: z.string().trim().max(80).optional(),
});

export async function saveCase(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = caseSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    court: formData.get("court"),
    categoryLabel: (formData.get("categoryLabel") as string) || "Live Case",
    question: formData.get("question"),
    summary: formData.get("summary"),
    disclaimer: (formData.get("disclaimer") as string) || undefined,
    contentWarning: (formData.get("contentWarning") as string) || undefined,
    heroImagePath: (formData.get("heroImagePath") as string) || undefined,
    phaseLabel: (formData.get("phaseLabel") as string) || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/cases/${(formData.get("id") as string) || "new"}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid input",
      )}`,
    );
  }
  const data = parsed.data;
  const db = getDb();
  const wordCount = data.summary.split(/\s+/).filter(Boolean).length;
  if (wordCount > 80) {
    redirect(
      `/admin/cases/${data.id ?? "new"}?error=${encodeURIComponent(
        `Summary is ${wordCount} words — the editorial limit is 80.`,
      )}`,
    );
  }

  const values = {
    slug: data.slug,
    title: data.title,
    court: data.court,
    categoryLabel: data.categoryLabel,
    question: data.question,
    summary: data.summary,
    disclaimer: data.disclaimer ?? null,
    contentWarning: data.contentWarning ?? null,
    heroImagePath: data.heroImagePath ?? null,
    phaseLabel: data.phaseLabel ?? null,
    summaryUpdatedAt: new Date(),
    updatedAt: new Date(),
  };

  let caseId = data.id ?? null;
  if (caseId) {
    await db.update(schema.cases).set(values).where(eq(schema.cases.id, caseId));
    await audit(admin.id, "case.update", "case", caseId, { slug: data.slug });
  } else {
    const [row] = await db.insert(schema.cases).values(values).returning();
    caseId = row.id;
    await audit(admin.id, "case.create", "case", caseId, { slug: data.slug });
  }
  revalidateCase(data.slug);
  redirect(`/admin/cases/${caseId}?saved=1`);
}

export async function setCaseStatus(
  caseId: string,
  status: "draft" | "open" | "closed",
) {
  const admin = await requireAdmin();
  const db = getDb();
  const [caseRow] = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .limit(1);
  if (!caseRow) return;
  await db
    .update(schema.cases)
    .set({
      status,
      votingClosedAt: status === "closed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.cases.id, caseId));
  await audit(admin.id, `case.status.${status}`, "case", caseId, {
    from: caseRow.status,
  });
  revalidateCase(caseRow.slug);
  redirect(`/admin/cases/${caseId}?saved=1`);
}

export async function featureCase(caseId: string) {
  const admin = await requireAdmin();
  const db = getDb();
  await db.update(schema.cases).set({ isFeatured: false });
  await db
    .update(schema.cases)
    .set({ isFeatured: true, updatedAt: new Date() })
    .where(eq(schema.cases.id, caseId));
  await audit(admin.id, "case.feature", "case", caseId);
  revalidateCase();
  redirect(`/admin/cases/${caseId}?saved=1`);
}

const outcomeSchema = z.object({
  caseId: z.string().uuid(),
  label: z.string().trim().min(2).max(120),
  colorKey: z.enum(["blue", "indigo", "green", "amber", "slate"]),
  sortOrder: z.coerce.number().int().min(0).max(99).default(0),
});

export async function addOutcome(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = outcomeSchema.safeParse({
    caseId: formData.get("caseId"),
    label: formData.get("label"),
    colorKey: formData.get("colorKey") ?? "blue",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return;
  await getDb().insert(schema.caseOutcomes).values(parsed.data);
  await audit(admin.id, "outcome.add", "case", parsed.data.caseId, {
    label: parsed.data.label,
  });
  revalidateCase();
  redirect(`/admin/cases/${parsed.data.caseId}?saved=1`);
}

export async function deleteOutcome(outcomeId: string, caseId: string) {
  const admin = await requireAdmin();
  const db = getDb();
  const [{ voteCount }] = await db
    .select({ voteCount: count() })
    .from(schema.votes)
    .where(eq(schema.votes.outcomeId, outcomeId));
  if (Number(voteCount) > 0) {
    redirect(
      `/admin/cases/${caseId}?error=${encodeURIComponent(
        "This outcome already has votes and cannot be deleted. Close the case instead.",
      )}`,
    );
  }
  await db
    .delete(schema.caseOutcomes)
    .where(eq(schema.caseOutcomes.id, outcomeId));
  await audit(admin.id, "outcome.delete", "outcome", outcomeId);
  revalidateCase();
  redirect(`/admin/cases/${caseId}?saved=1`);
}

const sourceSchema = z.object({
  caseId: z.string().uuid(),
  outlet: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(250),
  url: z.string().trim().url().max(500),
  sortOrder: z.coerce.number().int().min(0).max(99).default(0),
});

export async function addSource(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = sourceSchema.safeParse({
    caseId: formData.get("caseId"),
    outlet: formData.get("outlet"),
    title: formData.get("title"),
    url: formData.get("url"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) {
    redirect(
      `/admin/cases/${formData.get("caseId")}?error=${encodeURIComponent(
        "Source needs an outlet, a title and a valid URL.",
      )}`,
    );
  }
  await getDb().insert(schema.caseSources).values(parsed.data);
  await audit(admin.id, "source.add", "case", parsed.data.caseId, {
    url: parsed.data.url,
  });
  revalidateCase();
  redirect(`/admin/cases/${parsed.data.caseId}?saved=1`);
}

export async function deleteSource(sourceId: string, caseId: string) {
  const admin = await requireAdmin();
  await getDb()
    .delete(schema.caseSources)
    .where(eq(schema.caseSources.id, sourceId));
  await audit(admin.id, "source.delete", "source", sourceId);
  revalidateCase();
  redirect(`/admin/cases/${caseId}?saved=1`);
}

const resolveSchema = z.object({
  caseId: z.string().uuid(),
  outcomeId: z.string().uuid(),
  officialSourceUrl: z.string().trim().url().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * Records the official court outcome, closes the market and marks the case
 * resolved. The official court decision is authoritative; with mixed verdicts
 * across counts, the most serious verdict is entered.
 */
export async function resolveCase(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = resolveSchema.safeParse({
    caseId: formData.get("caseId"),
    outcomeId: formData.get("outcomeId"),
    officialSourceUrl:
      (formData.get("officialSourceUrl") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/cases/${formData.get("caseId")}?error=${encodeURIComponent(
        "Pick the official outcome (a valid source URL is recommended).",
      )}`,
    );
  }
  const { caseId, outcomeId, officialSourceUrl, notes } = parsed.data;
  const db = getDb();
  const [caseRow] = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .limit(1);
  if (!caseRow) return;

  const resolutionValues = {
    caseId,
    outcomeId,
    officialSourceUrl: officialSourceUrl ?? null,
    notes: notes ?? null,
    resolvedById: admin.id,
    resolvedAt: new Date(),
  };
  await db
    .insert(schema.caseResolutions)
    .values(resolutionValues)
    .onConflictDoUpdate({
      target: schema.caseResolutions.caseId,
      set: resolutionValues,
    });
  await db
    .update(schema.cases)
    .set({
      status: "resolved",
      votingClosedAt: caseRow.votingClosedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.cases.id, caseId));
  await audit(admin.id, "case.resolve", "case", caseId, {
    outcomeId,
    officialSourceUrl,
  });
  revalidateCase(caseRow.slug);
  redirect(`/admin/cases/${caseId}?saved=1`);
}

export async function setSuggestionStatus(
  suggestionId: string,
  status: "pending" | "accepted" | "declined",
) {
  const admin = await requireAdmin();
  await getDb()
    .update(schema.caseSuggestions)
    .set({ status })
    .where(eq(schema.caseSuggestions.id, suggestionId));
  await audit(admin.id, `suggestion.${status}`, "case_suggestion", suggestionId);
  revalidatePath("/admin/suggestions");
  revalidatePath("/account");
  redirect("/admin/suggestions?saved=1");
}

const donationSchema = z.object({
  mode: z.enum(["fixed_per_membership", "percent_revenue", "net_proceeds"]),
  fixedDollars: z.coerce.number().min(0).max(7.99).default(1),
  percent: z.coerce.number().int().min(1).max(100).default(20),
  charityId: z.string().uuid().nullable(),
  methodology: z.string().trim().max(1500),
});

export async function saveDonationSettings(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = donationSchema.safeParse({
    mode: formData.get("mode"),
    fixedDollars: formData.get("fixedDollars") ?? 1,
    percent: formData.get("percent") ?? 20,
    charityId: (formData.get("charityId") as string) || null,
    methodology: (formData.get("methodology") as string) ?? "",
  });
  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent("Invalid donation settings.")}`);
  }
  const value: DonationSettings = {
    mode: parsed.data.mode,
    fixedCentsPerMembership: Math.round(parsed.data.fixedDollars * 100),
    percent: parsed.data.percent,
    charityId: parsed.data.charityId,
    methodology: parsed.data.methodology,
  };
  const db = getDb();
  await db
    .insert(schema.siteSettings)
    .values({ key: "donation", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value, updatedAt: new Date() },
    });
  await audit(admin.id, "settings.donation.update", "settings", "donation", {
    mode: value.mode,
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

const charitySchema = z.object({
  name: z.string().trim().min(2).max(160),
  url: z.string().trim().url().max(400).optional(),
  description: z.string().trim().max(600).optional(),
});

export async function createCharity(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = charitySchema.safeParse({
    name: formData.get("name"),
    url: (formData.get("url") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
  });
  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent("Charity needs a name (URL optional).")}`);
  }
  const [row] = await getDb()
    .insert(schema.charities)
    .values({
      name: parsed.data.name,
      url: parsed.data.url ?? null,
      description: parsed.data.description ?? null,
    })
    .returning();
  await audit(admin.id, "charity.create", "charity", row.id, {
    name: row.name,
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

const reportSchema = z.object({
  charityId: z.string().uuid(),
  periodLabel: z.string().trim().min(2).max(120),
  amountDollars: z.coerce.number().min(0),
  methodNote: z.string().trim().max(600).optional(),
  receiptUrl: z.string().trim().url().max(500).optional(),
});

export async function addDonationReport(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = reportSchema.safeParse({
    charityId: formData.get("charityId"),
    periodLabel: formData.get("periodLabel"),
    amountDollars: formData.get("amountDollars"),
    methodNote: (formData.get("methodNote") as string) || undefined,
    receiptUrl: (formData.get("receiptUrl") as string) || undefined,
  });
  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent("Report needs a charity, period and amount.")}`);
  }
  const [row] = await getDb()
    .insert(schema.donationReports)
    .values({
      charityId: parsed.data.charityId,
      periodLabel: parsed.data.periodLabel,
      amountCents: Math.round(parsed.data.amountDollars * 100),
      methodNote: parsed.data.methodNote ?? null,
      receiptUrl: parsed.data.receiptUrl ?? null,
      donatedAt: new Date(),
    })
    .returning();
  await audit(admin.id, "donation_report.add", "donation_report", row.id, {
    periodLabel: row.periodLabel,
    amountCents: row.amountCents,
  });
  revalidatePath("/impact");
  redirect("/admin/settings?saved=1");
}
