import {
  addDonationReport,
  createCharity,
  saveDonationSettings,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { donationStatement } from "@/lib/donation";
import { formatMoney } from "@/lib/format";
import {
  getActiveCharity,
  getDonationSettings,
  listCharities,
  listDonationReports,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ error, saved }, settings, charitiesList, reports, activeCharity] =
    await Promise.all([
      searchParams,
      getDonationSettings(),
      listCharities(),
      listDonationReports(),
      getActiveCharity(),
    ]);

  return (
    <div className="max-w-3xl space-y-6">
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-xl border border-result-green/30 bg-result-green/10 px-4 py-2.5 text-[13px] text-foreground/80">
          Saved.
        </p>
      )}

      {/* Donation statement */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Donation statement
        </h3>
        <p className="mt-2 rounded-xl bg-muted/60 px-4 py-3 text-[14px] italic text-foreground/80">
          “{donationStatement(settings, activeCharity?.name ?? null)}”
        </p>
        <form action={saveDonationSettings} className="mt-4 space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Model</Label>
              <select name="mode" className={selectClass} defaultValue={settings.mode}>
                <option value="fixed_per_membership">
                  Fixed $ per membership (most transparent)
                </option>
                <option value="percent_revenue">% of membership revenue</option>
                <option value="net_proceeds">100% of net proceeds</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Active charity</Label>
              <select
                name="charityId"
                className={selectClass}
                defaultValue={settings.charityId ?? ""}
              >
                <option value="">— none selected —</option>
                {charitiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Fixed amount per membership ($)</Label>
              <Input
                name="fixedDollars"
                type="number"
                step="0.01"
                min={0}
                max={7.99}
                defaultValue={(settings.fixedCentsPerMembership / 100).toFixed(2)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Percent of revenue (%)</Label>
              <Input
                name="percent"
                type="number"
                min={1}
                max={100}
                defaultValue={settings.percent}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">
              Methodology (shown verbatim on /impact)
            </Label>
            <Textarea name="methodology" rows={3} defaultValue={settings.methodology} />
          </div>
          <Button type="submit" size="sm" className="rounded-full px-5">
            Save donation settings
          </Button>
        </form>
      </section>

      {/* Charities */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Charities
        </h3>
        <ul className="mt-3 space-y-2">
          {charitiesList.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border/70 px-3.5 py-2.5 text-[14px]"
            >
              <span className="font-medium">{c.name}</span>
              {c.url && (
                <span className="text-muted-foreground"> · {c.url}</span>
              )}
            </li>
          ))}
          {charitiesList.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-4 py-4 text-center text-[13px] text-muted-foreground">
              No charities yet.
            </li>
          )}
        </ul>
        <form action={createCharity} className="mt-4 grid gap-2 sm:grid-cols-2">
          <Input name="name" required placeholder="Charity name" className="h-9" />
          <Input name="url" type="url" placeholder="https://…" className="h-9" />
          <Input
            name="description"
            placeholder="One-line description shown on /impact"
            className="h-9 sm:col-span-2"
          />
          <Button type="submit" size="sm" className="h-9 w-fit rounded-full px-4">
            Add charity
          </Button>
        </form>
      </section>

      {/* Donation reports */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Donation reports (published on /impact)
        </h3>
        <ul className="mt-3 space-y-2">
          {reports.map(({ report, charity }) => (
            <li
              key={report.id}
              className="flex items-center justify-between rounded-xl border border-border/70 px-3.5 py-2.5 text-[14px]"
            >
              <span>
                {report.periodLabel} → {charity.name}
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(report.amountCents, report.currency)}
              </span>
            </li>
          ))}
          {reports.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-4 py-4 text-center text-[13px] text-muted-foreground">
              No reports published yet.
            </li>
          )}
        </ul>
        <form action={addDonationReport} className="mt-4 grid gap-2 sm:grid-cols-2">
          <select name="charityId" required className={selectClass} defaultValue={activeCharity?.id ?? ""}>
            <option value="" disabled>
              Charity…
            </option>
            {charitiesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input name="periodLabel" required placeholder="Period (e.g. September 2026)" className="h-9" />
          <Input
            name="amountDollars"
            type="number"
            step="0.01"
            min={0}
            required
            placeholder="Amount in USD"
            className="h-9"
          />
          <Input name="receiptUrl" type="url" placeholder="Receipt URL (optional)" className="h-9" />
          <Input
            name="methodNote"
            placeholder="Method note, e.g. “412 active memberships × $1”"
            className="h-9 sm:col-span-2"
          />
          <Button type="submit" size="sm" className="h-9 w-fit rounded-full px-4">
            Publish report
          </Button>
        </form>
      </section>
    </div>
  );
}
