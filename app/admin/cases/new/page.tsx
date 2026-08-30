import { CaseForm } from "@/components/admin/case-form";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="font-serif text-xl">New case</h2>
        <p className="text-[13px] text-muted-foreground">
          Cases start as drafts — add outcomes and sources, preview, then open
          voting.
        </p>
      </div>
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </p>
      )}
      <div className="rounded-2xl border border-border/80 bg-card p-5 md:p-6">
        <CaseForm />
      </div>
    </div>
  );
}
