"use client";

import { useRef, useState, useTransition } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { suggestCase } from "@/lib/actions/suggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SuggestCaseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await suggestCase({
        caseName: String(formData.get("caseName") ?? ""),
        court: String(formData.get("court") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        sourceUrl: String(formData.get("sourceUrl") ?? ""),
      });
      if (result.ok) {
        formRef.current?.reset();
        setSubmitted(true);
        toast.success("Thanks — our editors will review your suggestion.");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (submitted) {
    return (
      <p className="flex items-start gap-2.5 rounded-2xl border border-result-green/30 bg-result-green/10 px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground/80">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-result-green" />
        Suggestion received. If we publish it, you earn $1 membership credit
        for every new member who joins through that case.
      </p>
    );
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2.5">
      <Input
        name="caseName"
        required
        minLength={3}
        placeholder="Case name (e.g. State v. Jane Doe)"
        className="h-10"
      />
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Input name="court" placeholder="Court / jurisdiction (optional)" className="h-10" />
        <Input
          name="sourceUrl"
          type="url"
          placeholder="News source URL (optional)"
          className="h-10"
        />
      </div>
      <Textarea
        name="reason"
        rows={2}
        placeholder="Why should we cover it? (optional)"
      />
      <Button type="submit" disabled={isPending} size="sm" className="rounded-full px-5">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit suggestion"}
      </Button>
    </form>
  );
}
