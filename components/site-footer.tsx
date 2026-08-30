import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/cases", label: "All cases" },
      { href: "/membership", label: "Membership" },
      { href: "/impact", label: "Impact" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/legal/editorial-policy", label: "Editorial policy" },
      { href: "/legal/corrections", label: "Corrections" },
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-card">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:max-w-5xl md:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs space-y-3">
            <Logo />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Public opinion forecasts on high-profile court cases — reported
              neutrally, sourced carefully.
            </p>
          </div>
          <div className="flex gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title} className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-foreground/70 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 border-t border-border/60 pt-6 text-[12px] leading-relaxed text-muted-foreground">
          © 2026 CaseCast. Every defendant is presumed innocent unless and
          until proven guilty in a court of law. Predictions on CaseCast are
          public opinion forecasts — not findings of guilt, legal conclusions,
          or statements about any person.
        </p>
      </div>
    </footer>
  );
}
