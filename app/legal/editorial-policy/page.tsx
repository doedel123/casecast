import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Editorial policy" };

export default function EditorialPolicyPage() {
  return (
    <LegalShell title="Editorial policy" updated="August 30, 2026">
      <p>
        Call the Case publishes public opinion forecasts about court proceedings
        that are already the subject of extensive public reporting. We aim for
        the tone of sober court journalism — never entertainment built on
        someone else&apos;s worst day.
      </p>

      <h2>Presumption of innocence</h2>
      <p>
        Every defendant is presumed innocent unless and until proven guilty in
        a court of law. Call the Case never asserts guilt or innocence. Our
        questions ask what a court <em>will decide</em>, not what a person{" "}
        <em>did</em>. Percentages shown on Call the Case are aggregated reader
        predictions — they are not evidence, probability of guilt, or a
        statement about any person.
      </p>

      <h2>Sourcing</h2>
      <ul>
        <li>
          Case summaries are based exclusively on official records and
          established news organizations, and every case lists its sources.
        </li>
        <li>
          Allegations are always attributed (“prosecutors allege”, “the
          defense argues”) and never stated as fact.
        </li>
        <li>Each case shows the date its file was last updated.</li>
        <li>We use only licensed or original imagery, and we favor neutral
          editorial illustration over sensational photography.</li>
      </ul>

      <h2>Sensitive content</h2>
      <p>
        Cases involving violence, children, suicide, or mental illness carry a
        clear content note. We do not publish graphic detail that serves no
        news purpose, and we write about mental illness in line with
        established reporting guidelines.
      </p>

      <h2>Participation limits</h2>
      <p>
        Jurors, alternates, attorneys, witnesses, court personnel, and anyone
        directly involved in a covered proceeding must not participate in
        predictions on that case. We may remove votes we reasonably believe
        violate this rule.
      </p>

      <h2>Market resolution</h2>
      <p>
        A case&apos;s market closes as soon as a verdict is announced. The
        official court decision is authoritative for resolution; where
        different counts produce different verdicts, the most serious verdict
        returned controls. Resolutions and any later changes are logged.
      </p>

      <h2>Comments &amp; discussion</h2>
      <p>
        Call the Case does not host open, unmoderated comment sections. Discussion
        shown on case pages is curated and moderated by our editors, and
        broader member discussion will only launch once we can moderate
        speculation about real people responsibly. Comments that assert guilt,
        attack participants, or introduce unverified claims are not published.
      </p>

      <h2>Fair play</h2>
      <p>
        Voting is free. Paid membership never adds weight to a vote, never
        reveals results early, and involves no wagering, odds, or winnings of
        monetary value. Forecast points and seasonal leaderboard recognition
        have no cash value. Member-suggested cases go through the same
        editorial review as any other case — suggesting a case buys no
        influence over how it is covered.
      </p>
    </LegalShell>
  );
}
