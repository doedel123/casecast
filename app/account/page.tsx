import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CircleCheck,
  CircleX,
  Hourglass,
  Lock,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/lib/actions/account";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  computeAccuracy,
  getFollowedCases,
  getPredictionHistory,
  getSubscription,
  isMember,
} from "@/lib/queries";
import { stripeConfigured, syncSubscriptionsForUser } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [{ welcome }, session] = await Promise.all([searchParams, auth()]);
  if (!session?.user) redirect("/signin?next=/account");
  const user = session.user;

  if (welcome === "1") {
    // Right after checkout the webhook may not have landed yet — pull the
    // subscription straight from Stripe so the member sees their status.
    try {
      await syncSubscriptionsForUser(user.id);
    } catch {
      // Non-fatal: the webhook will reconcile.
    }
  }

  const [member, subscription, history] = await Promise.all([
    isMember(user.id),
    getSubscription(user.id),
    getPredictionHistory(user.id),
  ]);
  const followed = member ? await getFollowedCases(user.id) : [];
  const accuracy = computeAccuracy(history);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-10">
      {welcome === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl border border-result-green/30 bg-result-green/10 px-4 py-3 text-[13.5px] font-medium text-foreground/85">
          <Sparkles className="h-4 w-4 text-result-green" />
          Welcome to Call the Case Membership — thank you for supporting the cause.
        </p>
      )}

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">
            {user.name ? user.name : "Your account"}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{user.email}</p>
        </div>
        {member && (
          <Badge className="rounded-full bg-primary/12 text-primary hover:bg-primary/12">
            <BadgeCheck className="h-3.5 w-3.5" /> Member
          </Badge>
        )}
      </header>

      {/* Membership */}
      <section className="mt-6 rounded-3xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Membership
        </h2>
        {member ? (
          <div className="mt-3 space-y-3">
            <p className="text-[14.5px] text-foreground/85">
              Call the Case Membership · $7.99/month
              {subscription?.currentPeriodEnd && (
                <span className="text-muted-foreground">
                  {" "}
                  ·{" "}
                  {subscription.cancelAtPeriodEnd
                    ? `ends ${formatDate(subscription.currentPeriodEnd)}`
                    : `renews ${formatDate(subscription.currentPeriodEnd)}`}
                </span>
              )}
            </p>
            {stripeConfigured() && (
              <form action="/api/stripe/portal" method="POST">
                <Button variant="outline" size="sm" className="rounded-full">
                  Manage or cancel
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-[14px] leading-relaxed text-foreground/75">
              Unlock your prediction history, accuracy score and followed cases
              — and support a transparent charitable cause.
            </p>
            <form action="/api/stripe/checkout" method="POST">
              <Button className="rounded-full px-5 font-semibold" disabled={!stripeConfigured()}>
                {stripeConfigured()
                  ? "Become a member — $7.99/month"
                  : "Checkout temporarily unavailable"}
              </Button>
            </form>
          </div>
        )}
      </section>

      {/* Prediction history */}
      <section className="mt-5 rounded-3xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Prediction history
          </h2>
          <span className="text-[13px] text-muted-foreground">
            {history.length} {history.length === 1 ? "prediction" : "predictions"}
          </span>
        </div>

        {member ? (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Predictions", value: String(history.length) },
                { label: "Resolved", value: String(accuracy.resolvedCount) },
                {
                  label: "Accuracy",
                  value: accuracy.pct === null ? "—" : `${accuracy.pct}%`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-muted/60 px-3 py-3 text-center"
                >
                  <p className="font-serif text-2xl font-semibold">{stat.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {history.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-muted-foreground">
                No predictions yet —{" "}
                <Link href="/" className="underline underline-offset-2">
                  the featured case
                </Link>{" "}
                is waiting.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {history.map((h) => {
                  const resolved = Boolean(h.resolvedOutcome);
                  const correct =
                    resolved && h.vote.outcomeId === h.resolvedOutcome?.id;
                  return (
                    <li key={h.vote.id}>
                      <Link
                        href={`/cases/${h.caseRow.slug}`}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14.5px] font-medium">
                            {h.caseRow.title}
                          </p>
                          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                            Your prediction: {h.outcome.label}
                          </p>
                          {resolved && h.resolvedOutcome && (
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                              Official: {h.resolvedOutcome.label}
                            </p>
                          )}
                        </div>
                        <span className="mt-0.5 shrink-0">
                          {!resolved ? (
                            <Hourglass className="h-4 w-4 text-result-amber" />
                          ) : correct ? (
                            <CircleCheck className="h-5 w-5 text-result-green" />
                          ) : (
                            <CircleX className="h-5 w-5 text-result-slate" />
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              You have made{" "}
              <span className="font-semibold text-foreground">
                {history.length}
              </span>{" "}
              {history.length === 1 ? "prediction" : "predictions"}. Your full
              history and accuracy score are part of{" "}
              <Link
                href="/membership"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Call the Case Membership
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      {/* Followed cases */}
      {member && (
        <section className="mt-5 rounded-3xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Followed cases
          </h2>
          {followed.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted-foreground">
              You aren&apos;t following any cases yet. Use “Follow case” on any
              case page.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {followed.map(({ caseRow }) => (
                <li key={caseRow.id}>
                  <Link
                    href={`/cases/${caseRow.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate text-[14.5px] font-medium">
                      {caseRow.title}
                    </span>
                    <StatusBadge
                      status={caseRow.status}
                      phaseLabel={caseRow.phaseLabel}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Separator className="my-8" />
      <form action={signOutAction}>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Sign out
        </Button>
      </form>
    </div>
  );
}
