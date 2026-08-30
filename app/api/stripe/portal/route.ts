import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST(req: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(`${origin}/signin?next=/account`, 303);
  }
  if (!stripeConfigured()) {
    return NextResponse.redirect(`${origin}/account`, 303);
  }
  const db = getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user?.stripeCustomerId) {
    return NextResponse.redirect(`${origin}/membership`, 303);
  }
  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/account`,
  });
  return NextResponse.redirect(portal.url, 303);
}
