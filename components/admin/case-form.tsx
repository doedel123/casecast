import { saveCase } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Case } from "@/lib/db/schema";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CaseForm({ caseRow }: { caseRow?: Case }) {
  return (
    <form action={saveCase} className="space-y-4">
      {caseRow && <input type="hidden" name="id" value={caseRow.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <Input
            name="title"
            required
            defaultValue={caseRow?.title}
            placeholder="Commonwealth v. Jane Doe"
          />
        </Field>
        <Field label="Slug" hint="Lowercase, hyphenated — becomes /cases/<slug>">
          <Input
            name="slug"
            required
            defaultValue={caseRow?.slug}
            placeholder="commonwealth-v-jane-doe"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </Field>
        <Field label="Court">
          <Input
            name="court"
            required
            defaultValue={caseRow?.court}
            placeholder="Plymouth County Superior Court, Massachusetts"
          />
        </Field>
        <Field label="Category label">
          <Input
            name="categoryLabel"
            defaultValue={caseRow?.categoryLabel ?? "Live Case"}
          />
        </Field>
        <Field
          label="Phase label"
          hint="Shown in the status chip while voting is open, e.g. “Jury deliberating”"
        >
          <Input
            name="phaseLabel"
            defaultValue={caseRow?.phaseLabel ?? ""}
            placeholder="Jury deliberating"
          />
        </Field>
        <Field label="Hero image path" hint="Path under /public or a full URL">
          <Input
            name="heroImagePath"
            defaultValue={caseRow?.heroImagePath ?? ""}
            placeholder="/images/case-default.jpg"
          />
        </Field>
      </div>
      <Field label="Prediction question">
        <Textarea
          name="question"
          required
          rows={2}
          defaultValue={caseRow?.question}
          placeholder="What will be the most serious verdict returned…"
        />
      </Field>
      <Field
        label="Summary"
        hint="Neutral, sourced, max 80 words. Attribute every allegation."
      >
        <Textarea name="summary" required rows={5} defaultValue={caseRow?.summary} />
      </Field>
      <Field
        label="Disclaimer"
        hint="Shown under the summary, e.g. plea status + “predictions are public opinion forecasts”."
      >
        <Textarea
          name="disclaimer"
          rows={3}
          defaultValue={caseRow?.disclaimer ?? ""}
        />
      </Field>
      <Field
        label="Content warning"
        hint="Required for violence, children, suicide, or mental illness."
      >
        <Input
          name="contentWarning"
          defaultValue={caseRow?.contentWarning ?? ""}
          placeholder="This case involves the deaths of children and discussion of mental illness."
        />
      </Field>
      <Button type="submit" className="rounded-full px-6">
        {caseRow ? "Save changes" : "Create case (as draft)"}
      </Button>
    </form>
  );
}
