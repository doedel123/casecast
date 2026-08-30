import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Corrections policy" };

export default function CorrectionsPage() {
  return (
    <LegalShell title="Corrections policy" updated="August 30, 2026">
      <p>
        We correct errors quickly, clearly, and without burying them. Court
        reporting moves fast; getting it right matters more than being first.
      </p>

      <h2>How corrections work</h2>
      <ul>
        <li>
          Substantive errors in a case summary are corrected as soon as they
          are verified, and the case&apos;s “updated” date reflects the change.
        </li>
        <li>
          Material corrections — anything that could have changed how readers
          understood the case — are noted on the case page itself.
        </li>
        <li>
          If a case was resolved against the wrong outcome, the resolution is
          corrected, the change is recorded in our audit log, and affected
          accuracy scores are recalculated.
        </li>
      </ul>

      <h2>Report an error</h2>
      <p>
        If you believe anything on Call the Case is inaccurate, email{" "}
        <a
          href="mailto:corrections@callthecase.com"
          className="underline underline-offset-2"
        >
          corrections@callthecase.com
        </a>{" "}
        with the case name and a source. We review every report.
      </p>
    </LegalShell>
  );
}
