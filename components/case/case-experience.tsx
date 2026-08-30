import { Lock } from "lucide-react";
import { CaseHero } from "@/components/case/case-hero";
import { FollowButton } from "@/components/case/follow-button";
import { ResultsPanel } from "@/components/case/results-panel";
import { VotePanel } from "@/components/case/vote-panel";
import { MembershipCta } from "@/components/membership-cta";
import { donationStatement } from "@/lib/donation";
import type { Case } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import {
  getActiveCharity,
  getCaseOutcomes,
  getCaseSources,
  getDonationSettings,
  getFollowedCaseIds,
  getResolution,
  getResults,
  getViewer,
  getViewerVote,
  isMember,
} from "@/lib/queries";

/**
 * The full case module: hero card, then the voting card — which strictly
 * switches to results only once this viewer has cast a vote — and, after a
 * vote, the membership call-to-action.
 */
export async function CaseExperience({
  caseRow,
  showMembershipCta = true,
}: {
  caseRow: Case;
  showMembershipCta?: boolean;
}) {
  const viewer = await getViewer();
  const [outcomes, sources, viewerVote, resolution, member, followedIds] =
    await Promise.all([
      getCaseOutcomes(caseRow.id),
      getCaseSources(caseRow.id),
      getViewerVote(caseRow.id, viewer),
      getResolution(caseRow.id),
      isMember(viewer.userId),
      getFollowedCaseIds(viewer.userId),
    ]);

  const hasVoted = Boolean(viewerVote);
  // Results are only fetched — and therefore only ever serialized — after
  // this viewer has voted.
  const results = hasVoted ? await getResults(caseRow.id) : null;

  const [donation, charity] = showMembershipCta
    ? await Promise.all([getDonationSettings(), getActiveCharity()])
    : [null, null];

  return (
    <div className="space-y-5">
      <CaseHero
        caseRow={caseRow}
        sources={sources}
        action={
          viewer.userId ? (
            <FollowButton
              caseId={caseRow.id}
              initialFollowing={followedIds.has(caseRow.id)}
            />
          ) : undefined
        }
      />

      {resolution && (
        <section className="rounded-3xl border border-result-blue/25 bg-result-blue/8 p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-result-blue">
            Official outcome
          </p>
          <p className="mt-1.5 font-serif text-xl leading-snug">
            {resolution.outcome.label}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Recorded {formatDate(resolution.resolution.resolvedAt)}
            {resolution.resolution.officialSourceUrl && (
              <>
                {" · "}
                <a
                  href={resolution.resolution.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Official source
                </a>
              </>
            )}
          </p>
          {resolution.resolution.notes && (
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">
              {resolution.resolution.notes}
            </p>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] md:p-7">
        <h2 className="font-serif text-xl leading-snug md:text-2xl">
          {caseRow.question}
        </h2>
        <p className="mt-1.5 mb-5 text-[12.5px] text-muted-foreground">
          {hasVoted
            ? "Live public forecast — not a finding of guilt."
            : "A public opinion forecast. Results unlock after your prediction."}
        </p>

        {hasVoted && results ? (
          <ResultsPanel
            caseId={caseRow.id}
            initial={results}
            viewerOutcomeId={viewerVote?.outcomeId ?? null}
            resolvedOutcomeId={resolution?.outcome.id ?? null}
            live={caseRow.status === "open"}
          />
        ) : caseRow.status === "open" ? (
          <VotePanel
            caseId={caseRow.id}
            outcomes={outcomes.map((o) => ({ id: o.id, label: o.label }))}
          />
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-4 text-[14px] leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Voting is closed for this case. Results are visible to the
              readers who cast a prediction while voting was open.
            </p>
          </div>
        )}
      </section>

      {hasVoted && showMembershipCta && !member && donation && (
        <MembershipCta
          donationLine={donationStatement(donation, charity?.name ?? null)}
        />
      )}
    </div>
  );
}
