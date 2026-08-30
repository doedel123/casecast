import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { isMember } from "@/lib/queries";
import {
  ensureStripeCustomer,
  getMembershipPriceId,
  getStripe,
  stripeConfigured,
} from "@/lib/stripe";

function appOrigin(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
}

export async function POST(req: Request) {
  const origin = appOrigin(req);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(`${origin}/signup?next=/membership`, 303);
  }
  if (!stripeConfigured()) {
    return NextResponse.redirect(
      `${origin}/membership?notice=payments_unavailable`,
      303,
    );
  }
  if (await isMember(session.user.id)) {
    return NextResponse.redirect(`${origin}/account`, 303);
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) {
    return NextResponse.redirect(`${origin}/signin?next=/membership`, 303);
  }

  const stripe = getStripe();
  const [customerId, priceId] = await Promise.all([
    ensureStripeCustomer(user),
    getMembershipPriceId(stripe),
  ]);

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?welcome=1`,
    cancel_url: `${origin}/membership`,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
  });

  return NextResponse.redirect(checkout.url ?? `${origin}/membership`, 303);
}
