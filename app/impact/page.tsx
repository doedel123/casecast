import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { donationStatement } from "@/lib/donation";
import { formatDate, formatMoney } from "@/lib/format";
import {
  getActiveCharity,
  getDonationSettings,
  listDonationReports,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impact",
  description:
    "How Call the Case membership revenue turns into donations — charity, calculation method and every transferred amount.",
};

export default async function ImpactPage() {
  const [settings, charity, reports] = await Promise.all([
    getDonationSettings(),
    getActiveCharity(),
    listDonationReports(),
  ]);
  const totalCents = reports.reduce((s, r) => s + r.report.amountCents, 0);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-12">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Impact
        </p>
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">
          Where the membership money goes
        </h1>
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          {donationStatement(settings, charity?.name ?? null)}
        </p>
      </header>

      {charity && (
        <section className="mt-7 rounded-3xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Current partner charity
          </p>
          <h2 className="mt-1.5 font-serif text-2xl">{charity.name}</h2>
          {charity.description && (
            <p className="mt-2 text-[14px] leading-relaxed text-foreground/75">
              {charity.description}
            </p>
          )}
          {charity.url && (
            <a
              href={charity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-primary hover:underline"
            >
              Visit their site <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          How the amount is calculated
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground/80">
          {settings.methodology}
        </p>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-xl">Donations to date</h2>
          {reports.length > 0 && (
            <p className="text-[13px] font-semibold text-result-green">
              {formatMoney(totalCents)} total
            </p>
          )}
        </div>
        {reports.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-[13.5px] text-muted-foreground">
            No donation periods have been closed yet. Every transfer will be
            published here with its amount, period and receipt.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Charity</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(({ report, charity: c }) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap">
                      <div>{report.periodLabel}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {report.donatedAt ? formatDate(report.donatedAt) : "—"}
                      </div>
                    </TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(report.amountCents, report.currency)}
                    </TableCell>
                    <TableCell>
                      {report.receiptUrl ? (
                        <a
                          href={report.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <p className="mt-8 text-[12.5px] leading-relaxed text-muted-foreground">
        Call the Case is not a charity. Your membership payment goes to Call the Case,
        which makes the donations listed above — the payment itself is not a
        tax-deductible charitable contribution. Questions? See our{" "}
        <Link href="/legal/terms" className="underline underline-offset-2">
          terms
        </Link>
        .
      </p>
    </div>
  );
}
