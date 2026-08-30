import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const caseStatus = pgEnum("case_status", [
  "draft",
  "open",
  "closed",
  "resolved",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    role: userRole("role").notNull().default("user"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`)],
);

// Device-scoped sessions for logged-out voters. No plaintext IPs are stored —
// only a salted hash used for abuse detection.
export const anonymousSessions = pgTable("anonymous_sessions", {
  id: uuid("id").primaryKey(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  claimedByUserId: uuid("claimed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cases = pgTable(
  "cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    court: text("court").notNull(),
    categoryLabel: text("category_label").notNull().default("Live Case"),
    question: text("question").notNull(),
    // Editorial guideline: neutral tone, max ~80 words, sourced facts only.
    summary: text("summary").notNull(),
    disclaimer: text("disclaimer"),
    contentWarning: text("content_warning"),
    heroImagePath: text("hero_image_path"),
    status: caseStatus("status").notNull().default("draft"),
    // Free-text procedural stage shown in the UI, e.g. "Jury deliberating".
    phaseLabel: text("phase_label"),
    isFeatured: boolean("is_featured").notNull().default(false),
    votingClosedAt: timestamp("voting_closed_at", { withTimezone: true }),
    summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("cases_slug_unique").on(t.slug)],
);

export const caseOutcomes = pgTable(
  "case_outcomes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    // Maps to a muted result color in the design system.
    colorKey: text("color_key").notNull().default("blue"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("case_outcomes_case_idx").on(t.caseId)],
);

export const caseSources = pgTable(
  "case_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    outlet: text("outlet").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("case_sources_case_idx").on(t.caseId)],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    outcomeId: uuid("outcome_id")
      .notNull()
      .references(() => caseOutcomes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    anonymousSessionId: uuid("anonymous_session_id").references(
      () => anonymousSessions.id,
      { onDelete: "set null" },
    ),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One vote per case per account, and per anonymous device session.
    uniqueIndex("votes_case_user_unique")
      .on(t.caseId, t.userId)
      .where(sql`${t.userId} is not null`),
    uniqueIndex("votes_case_anon_unique")
      .on(t.caseId, t.anonymousSessionId)
      .where(sql`${t.anonymousSessionId} is not null`),
    index("votes_case_idx").on(t.caseId),
    index("votes_ip_hash_idx").on(t.ipHash),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    status: text("status").notNull(),
    priceId: text("price_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_sub_unique").on(t.stripeSubscriptionId),
    index("subscriptions_user_idx").on(t.userId),
  ],
);

export const charities = pgTable("charities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const donationReports = pgTable("donation_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  charityId: uuid("charity_id")
    .notNull()
    .references(() => charities.id, { onDelete: "restrict" }),
  periodLabel: text("period_label").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  methodNote: text("method_note"),
  receiptUrl: text("receipt_url"),
  donatedAt: timestamp("donated_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const caseResolutions = pgTable(
  "case_resolutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    outcomeId: uuid("outcome_id")
      .notNull()
      .references(() => caseOutcomes.id, { onDelete: "restrict" }),
    officialSourceUrl: text("official_source_url"),
    notes: text("notes"),
    resolvedById: uuid("resolved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("case_resolutions_case_unique").on(t.caseId)],
);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: uuid("admin_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("admin_audit_created_idx").on(t.createdAt)],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const caseFollows = pgTable(
  "case_follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("case_follows_user_case_unique").on(t.userId, t.caseId)],
);

// Curated, admin-managed discussion entries shown as a teaser on case pages.
// There is no public write path — open commenting stays off per editorial policy.
export const caseComments = pgTable(
  "case_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("case_comments_case_idx").on(t.caseId)],
);

export type User = typeof users.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type CaseOutcome = typeof caseOutcomes.$inferSelect;
export type CaseSource = typeof caseSources.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Charity = typeof charities.$inferSelect;
export type DonationReport = typeof donationReports.$inferSelect;
export type CaseResolution = typeof caseResolutions.$inferSelect;
