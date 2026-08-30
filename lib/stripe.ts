import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const MEMBERSHIP_PRICE_CENTS = 799;
export const MEMBERSHIP_LOOKUP_KEY = "casecast_membership_monthly_799";

function secretKey() {
  return process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY ?? null;
}

export function stripeConfigured() {
  return Boolean(secretKey());
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = secretKey();
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

/**
 * Resolves the $7.99/month membership price. Uses STRIPE_PRICE_ID when set,
 * otherwise finds-or-creates a product + price by lookup key so a fresh
 * Stripe (sandbox) account needs zero dashboard steps.
 */
export async function getMembershipPriceId(stripe: Stripe): Promise<string> {
  if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID;
  const existing = await stripe.prices.list({
    lookup_keys: [MEMBERSHIP_LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;
  const product = await stripe.products.create({
    name: "Call the Case Membership",
    description:
      "Prediction history, accuracy score, followed cases and verdict alerts. Cancel anytime.",
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: MEMBERSHIP_PRICE_CENTS,
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: MEMBERSHIP_LOOKUP_KEY,
  });
  return price.id;
}

export async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { appUserId: user.id },
  });
  await getDb()
    .update(schema.users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(schema.users.id, user.id));
  return customer.id;
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  // Basil API moved current_period_end onto subscription items.
  const item = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  const ts =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

/**
 * Pulls a user's subscriptions straight from Stripe and mirrors them into the
 * database. Fallback for the moment right after checkout, when the webhook
 * may not have arrived yet.
 */
export async function syncSubscriptionsForUser(userId: string) {
  if (!stripeConfigured()) return;
  const db = getDb();
  const [user] = await db
    .select({ stripeCustomerId: schema.users.stripeCustomerId })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user?.stripeCustomerId) return;
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 5,
  });
  for (const sub of subs.data) {
    await syncSubscription(sub);
  }
}

export async function syncSubscription(sub: Stripe.Subscription) {
  const db = getDb();
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let userId = sub.metadata?.userId ?? null;
  if (!userId) {
    const [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.stripeCustomerId, customerId))
      .limit(1);
    userId = user?.id ?? null;
  }
  if (!userId) return;

  const values = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    priceId: sub.items?.data?.[0]?.price?.id ?? null,
    currentPeriodEnd: periodEnd(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    updatedAt: new Date(),
  };

  await db
    .insert(schema.subscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: schema.subscriptions.stripeSubscriptionId,
      set: values,
    });
}
