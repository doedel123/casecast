import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { caseComments } from "@/lib/db/schema";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type CaseComment = typeof caseComments.$inferSelect;

const AVATAR_TONES = [
  "bg-result-blue/15 text-result-blue",
  "bg-primary/12 text-primary",
  "bg-result-green/15 text-result-green",
  "bg-result-amber/18 text-result-amber",
  "bg-result-indigo/15 text-result-indigo",
];

/**
 * Curated discussion preview: comments fade out toward the bottom and the
 * call-to-action routes straight to membership. There is deliberately no
 * public write path — see the editorial policy.
 */
export function DiscussionTeaser({
  comments,
  isMember,
}: {
  comments: CaseComment[];
  isMember: boolean;
}) {
  if (comments.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 px-5 pt-5 md:px-7 md:pt-7">
        <MessagesSquare className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl leading-snug md:text-2xl">Discussion</h2>
      </div>
      <div className="relative">
        <ul className="space-y-5 px-5 pb-36 pt-4 md:px-7">
          {comments.map((comment, i) => (
            <li key={comment.id} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold uppercase",
                  AVATAR_TONES[i % AVATAR_TONES.length],
                )}
                aria-hidden
              >
                {comment.authorName.slice(0, 2)}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[12.5px] text-muted-foreground">
                  <span className="font-semibold text-foreground/85">
                    {comment.authorName}
                  </span>{" "}
                  · {timeAgo(comment.createdAt)}
                </p>
                <p className="text-[14px] leading-relaxed text-foreground/80">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Fade the tail of the thread into the card */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-card via-card/90 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 px-5">
          {isMember ? (
            <p className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground shadow-sm">
              Member discussion opens soon — you&apos;re on the list.
            </p>
          ) : (
            <>
              <Button
                render={<Link href="/membership" />}
                nativeButton={false}
                size="lg"
                className="h-11 rounded-full px-7 text-[15px] font-semibold shadow-sm"
              >
                Join the discussion
              </Button>
              <p className="text-[11.5px] text-muted-foreground">
                Discussion is part of Call the Case Membership.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
