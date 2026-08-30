import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/status-badge";
import { listPublicCases } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cases",
  description: "All court cases currently covered on Call the Case.",
};

export default async function CasesPage() {
  const cases = await listPublicCases();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:max-w-5xl md:px-6">
      <header className="mb-6 space-y-1.5">
        <h1 className="font-serif text-3xl md:text-4xl">Cases</h1>
        <p className="text-[14px] text-muted-foreground">
          Public opinion forecasts on proceedings in open court. One prediction
          per reader, per case.
        </p>
      </header>

      {cases.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          No cases published yet.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-lg)]"
              >
                <div className="relative aspect-[5/2] w-full overflow-hidden">
                  <Image
                    src={c.heroImagePath ?? "/images/case-default.jpg"}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <StatusBadge status={c.status} phaseLabel={c.phaseLabel} className="self-start" />
                  <h2 className="font-serif text-xl leading-snug group-hover:text-primary">
                    {c.title}
                  </h2>
                  <p className="text-[13px] text-muted-foreground">{c.court}</p>
                  <p className="mt-auto pt-1 text-[12px] text-muted-foreground">
                    Updated {formatDate(c.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
