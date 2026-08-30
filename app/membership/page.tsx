import Link from "next/link";
import type { Metadata } from "next";
import {
  BarChart3,
  Bell,
  BookmarkCheck,
  Check,
  FileClock,
  HeartHandshake,
  Lightbulb,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { donationStatement } from "@/lib/donation";
import {
  getActiveCharity,
  getDonationSettings,
  isMember,
} from "@/lib/queries";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Call the Case Membership — $7.99/month. Prediction history, accuracy score, followed cases and verdict alerts. Cancel anytime.",
};

const BENEFITS = [
  { icon: BarChart3, text: "Personal prediction history & accuracy score" },
  {
    icon: Target,
    text: "Forecast points for every verdict you call correctly",
  },
  {
    icon: Lightbulb,
    text: "Suggest new cases — earn $1 membership credit for every new member your case brings in",
  },
  { icon: BookmarkCheck, text: "Save cases and follow them" },
  { icon: Bell, text: "Notifications when verdicts come in" },
  { icon: FileClock, text: "Detailed case timelines and sources" },
  {
    icon: Trophy,
    text: "Seasonal leaderboards — recognition for the season's best forecasters",
  },
];

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ notice }, session, donation, charity] = await Promise.all([
    searchParams,
    auth(),
    getDonationSettings(),
    getActiveCharity(),
  ]);
  const user = session?.user ?? null;
  const member = user ? await isMember(user.id) : false;
  const donationLine = donationStatement(donation, charity?.name ?? null);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-12">
      {notice === "payments_unavailable" && (
        <p className="mb-5 rounded-xl border border-result-amber/40 bg-result-amber/10 px-4 py-3 text-[13.5px] text-foreground/80">
          Checkout is temporarily unavailable — payments are not fully
          configured yet. Please try again soon.
        </p>
      )}

      <header className="space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Call the Case Membership
        </p>
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">
          Follow the verdict. Track your predictions. Support a cause.
        </h1>
      </header>

      <section className="mt-7 rounded-3xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card-lg)] md:p-8">
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-serif text-5xl font-semibold">$7.99</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        <p className="mt-1 text-center text-[13px] text-muted-foreground">
          Cancel anytime.
        </p>

        <ul className="mt-6 space-y-3">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-start gap-3 text-[14.5px] text-foreground/85">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-result-green/15">
                <Check className="h-3 w-3 text-result-green" strokeWidth={3} />
              </span>
              {b.text}
            </li>
          ))}
        </ul>

        <div className="mt-7">
          {member ? (
            <Button
              render={<Link href="/account" />} nativeButton={false}
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full text-base"
            >
              You&apos;re a member — manage your plan
            </Button>
          ) : user ? (
            <form action="/api/stripe/checkout" method="POST">
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full text-base font-semibold"
                disabled={!stripeConfigured()}
              >
                {stripeConfigured()
                  ? "Continue to checkout"
                  : "Checkout temporarily unavailable"}
              </Button>
            </form>
          ) : (
            <Button
              render={<Link href="/signup?next=/membership" />} nativeButton={false}
              size="lg"
              className="h-12 w-full rounded-full text-base font-semibold"
            >
              Create your account
            </Button>
          )}
          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            Secure payment via Stripe.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5">
        <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-foreground/80">
          <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-result-green" />
          <span>
            {donationLine}{" "}
            <Link href="/impact" className="font-medium underline underline-offset-2">
              Full transparency on /impact
            </Link>
          </span>
        </p>
      </section>

      <section className="mt-6 space-y-2 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
        <p>
          Fair play: membership never gives your prediction extra weight and
          never affects the public forecast. Call the Case involves no wagering
          and no odds — predictions are free for everyone, and forecast points
          and leaderboard recognition carry no monetary value. Referral credit
          for suggested cases is subscription credit, not a prize or payout.
        </p>
        <p>
          Your membership payment goes to Call the Case, which makes the donations
          described above; the payment itself is not a tax-deductible
          charitable contribution.
        </p>
      </section>
    </div>
  );
}
