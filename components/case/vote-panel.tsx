"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { castVote } from "@/lib/actions/vote";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/case/turnstile-widget";
import { cn } from "@/lib/utils";

type Outcome = { id: string; label: string };

export function VotePanel({
  caseId,
  outcomes,
}: {
  caseId: string;
  outcomes: Outcome[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const onToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const submit = () => {
    if (!selected || isPending) return;
    startTransition(async () => {
      const result = await castVote({
        caseId,
        outcomeId: selected,
        turnstileToken,
      });
      if (result.ok || ("alreadyVoted" in result && result.alreadyVoted)) {
        if (result.ok) toast.success("Your prediction has been recorded.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Possible outcomes" className="space-y-2.5">
        {outcomes.map((outcome) => {
          const isSelected = selected === outcome.id;
          return (
            <button
              key={outcome.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isPending}
              onClick={() => setSelected(outcome.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3.5 text-left text-[15px] font-medium transition-all",
                "min-h-[3.25rem] active:scale-[0.99]",
                isSelected
                  ? "border-primary bg-accent text-foreground ring-2 ring-primary/25"
                  : "border-input text-foreground/85 hover:border-foreground/25 hover:bg-muted/60",
              )}
            >
              <span className="leading-snug">{outcome.label}</span>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card",
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {siteKey && <TurnstileWidget siteKey={siteKey} onToken={onToken} />}

      <Button
        onClick={submit}
        disabled={!selected || isPending}
        size="lg"
        className="h-12 w-full rounded-full text-base font-semibold shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Recording…
          </>
        ) : (
          "Cast my prediction"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your prediction cannot be changed. Results appear after you vote.
      </p>
    </div>
  );
}
