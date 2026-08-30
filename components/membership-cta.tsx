import Link from "next/link";
import { BarChart3, BookmarkCheck, HeartHandshake, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERKS = [
  {
    icon: BarChart3,
    text: "Prediction history, accuracy score & forecast points",
  },
  {
    icon: Lightbulb,
    text: "Suggest cases — earn credit when they draw new members",
  },
  { icon: BookmarkCheck, text: "Follow cases and get verdict alerts" },
];

export function MembershipCta({ donationLine }: { donationLine: string }) {
  return (
    <section className="animate-fade-up rounded-3xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] md:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        Call the Case Membership
      </p>
      <h2 className="mt-2 font-serif text-2xl leading-snug md:text-[1.75rem]">
        Follow the verdict. Track your predictions. Support a cause.
      </h2>
      <ul className="mt-4 space-y-2.5">
        {PERKS.map((perk) => (
          <li
            key={perk.text}
            className="flex items-start gap-2.5 text-[14px] text-foreground/80"
          >
            <perk.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {perk.text}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-serif text-3xl font-semibold">$7.99</span>
        <span className="text-sm text-muted-foreground">/month · Cancel anytime</span>
      </div>
      <Button
        render={<Link href="/membership" />} nativeButton={false}
        size="lg"
        className="mt-4 h-12 w-full rounded-full text-base font-semibold"
      >
        Become a member
      </Button>
      <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
        <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-result-green" />
        <span>
          {donationLine}{" "}
          <Link href="/impact" className="underline underline-offset-2 hover:text-foreground">
            See how it works
          </Link>
        </span>
      </p>
    </section>
  );
}
