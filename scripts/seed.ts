/**
 * Idempotent seed: admin user, charity, donation settings, and the launch
 * case (Commonwealth v. Lindsay Clancy) with outcomes and sources.
 *
 * Run with: npm run db:seed
 */
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { loadEnvLocal } from "./env";

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — run `vercel env pull .env.local --yes` first.");
  process.exit(1);
}
const db = drizzle(neon(url), { schema });

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@casecast.local").toLowerCase();
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);
  if (existing) {
    console.log(`✓ Admin user already exists (${email})`);
    return;
  }
  const password =
    process.env.ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
  await db.insert(schema.users).values({
    email,
    passwordHash: await hash(password, 10),
    name: "CaseCast Admin",
    role: "admin",
  });
  console.log("✓ Admin user created");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("  (change this after first sign-in; set ADMIN_EMAIL/ADMIN_PASSWORD to control it)");
}

async function seedCharity(): Promise<string> {
  const name = "Postpartum Support International";
  const [existing] = await db
    .select()
    .from(schema.charities)
    .where(eq(schema.charities.name, name))
    .limit(1);
  if (existing) {
    console.log("✓ Charity already exists");
    return existing.id;
  }
  const [row] = await db
    .insert(schema.charities)
    .values({
      name,
      url: "https://www.postpartum.net",
      description:
        "Supports families experiencing perinatal mental health conditions such as postpartum depression and psychosis, through helplines, support groups and provider training.",
    })
    .returning();
  console.log("✓ Charity created");
  return row.id;
}

async function seedDonationSettings(charityId: string) {
  await db
    .insert(schema.siteSettings)
    .values({
      key: "donation",
      value: {
        mode: "fixed_per_membership",
        fixedCentsPerMembership: 100,
        percent: 20,
        charityId,
        methodology:
          "Donations are calculated at the end of each calendar month: $1 for every paid, non-refunded membership active during that month. Transfers happen within 15 days of month end, and every transfer is published on this page with its amount and receipt.",
      },
    })
    .onConflictDoNothing();
  console.log("✓ Donation settings ensured");
}

async function seedClancyCase() {
  const slug = "commonwealth-v-lindsay-clancy";
  const [existing] = await db
    .select({ id: schema.cases.id })
    .from(schema.cases)
    .where(eq(schema.cases.slug, slug))
    .limit(1);
  if (existing) {
    console.log("✓ Launch case already exists");
    return;
  }

  const [caseRow] = await db
    .insert(schema.cases)
    .values({
      slug,
      title: "Commonwealth v. Lindsay Clancy",
      court: "Plymouth County Superior Court, Massachusetts",
      categoryLabel: "Live Case",
      question:
        "What will be the most serious verdict returned against Lindsay Clancy on any homicide count?",
      summary:
        "Lindsay Clancy, a former labor-and-delivery nurse from Duxbury, Massachusetts, is charged with murder in the deaths of her three young children in January 2023. Prosecutors allege she strangled the children at the family's home. Her defense argues she was in a severe psychiatric crisis and lacked criminal responsibility. She has pleaded not guilty. After a multi-week trial in Plymouth County Superior Court, the jury began deliberating on August 27, 2026.",
      disclaimer:
        "Lindsay Clancy has pleaded not guilty. Her defense argues that she lacked criminal responsibility at the time of the alleged offenses. CaseCast predictions are public opinion forecasts, not findings of guilt.",
      contentWarning:
        "This case involves the deaths of children and discussion of mental illness.",
      heroImagePath: "/images/hero-clancy.jpg",
      status: "open",
      phaseLabel: "Jury deliberating",
      isFeatured: true,
    })
    .returning();

  const outcomes: { label: string; colorKey: string }[] = [
    { label: "First-degree murder", colorKey: "blue" },
    { label: "Second-degree murder", colorKey: "indigo" },
    { label: "Manslaughter", colorKey: "amber" },
    {
      label: "Not guilty due to lack of criminal responsibility",
      colorKey: "green",
    },
    { label: "Not guilty", colorKey: "slate" },
  ];
  await db.insert(schema.caseOutcomes).values(
    outcomes.map((o, i) => ({
      caseId: caseRow.id,
      label: o.label,
      colorKey: o.colorKey,
      sortOrder: i,
    })),
  );

  await db.insert(schema.caseSources).values([
    {
      caseId: caseRow.id,
      outlet: "CBS News Boston",
      title: "Lindsay Clancy trial live updates: jury deliberations",
      url: "https://www.cbsnews.com/boston/live-updates/lindsay-clancy-trial-live-updates-closing-arguments/",
      publishedAt: new Date("2026-08-27T12:00:00-04:00"),
      sortOrder: 0,
    },
    {
      caseId: caseRow.id,
      outlet: "Boston.com",
      title: "No verdict after second day of deliberations; jury resumes Monday",
      url: "https://www.boston.com/news/crime/2026/08/28/lindsay-clancy-trial-jury-deliberations-verdict-watch-august-28/",
      publishedAt: new Date("2026-08-28T18:00:00-04:00"),
      sortOrder: 1,
    },
    {
      caseId: caseRow.id,
      outlet: "NewsNation",
      title: "What each possible verdict in the Lindsay Clancy trial would mean",
      url: "https://www.newsnationnow.com/crime/lindsay-clancy-possible-verdicts/",
      publishedAt: new Date("2026-08-26T12:00:00-04:00"),
      sortOrder: 2,
    },
  ]);

  console.log("✓ Launch case created (open, featured, jury deliberating)");
}

async function main() {
  await seedAdmin();
  const charityId = await seedCharity();
  await seedDonationSettings(charityId);
  await seedClancyCase();
  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
