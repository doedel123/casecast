import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalShell title="Terms of service" updated="August 30, 2026">
      <p>
        Welcome to Call the Case. By using this site you agree to these terms. If
        you do not agree, please do not use Call the Case.
      </p>

      <h2>What Call the Case is</h2>
      <p>
        Call the Case publishes neutral summaries of public court proceedings and
        lets readers record a free, non-monetary prediction about the outcome.
        Aggregated predictions are opinion polling — they are not legal
        analysis, not advice, not evidence, and not statements of fact about
        any person. Call the Case involves no wagering, stakes, odds, or prizes of
        monetary value.
      </p>

      <h2>Predictions</h2>
      <ul>
        <li>One prediction per person per case. Predictions are final and
          cannot be changed.</li>
        <li>
          Automated voting, vote manipulation, and circumventing the one-vote
          rule are prohibited and may lead to removal of votes or accounts.
        </li>
        <li>
          Jurors, attorneys, witnesses, court personnel, and others directly
          involved in a covered proceeding may not participate in that case.
        </li>
      </ul>

      <h2>Membership</h2>
      <ul>
        <li>
          Call the Case Membership costs $7.99 per month, billed via Stripe, and
          can be canceled anytime; access continues until the end of the paid
          period.
        </li>
        <li>
          Membership adds convenience features only. It never changes how
          votes are counted and grants no chance of winnings.
        </li>
        <li>
          Donations described on our Impact page are made by Call the Case from its
          revenue. Your membership payment is not a tax-deductible charitable
          contribution.
        </li>
      </ul>

      <h2>Accounts</h2>
      <p>
        You are responsible for your account credentials and for the accuracy
        of the information you provide. We may suspend accounts that violate
        these terms.
      </p>

      <h2>Content</h2>
      <p>
        Case materials are provided for personal, non-commercial use.
        Call the Case content is provided “as is” without warranties; court
        proceedings can change quickly and summaries may lag official events.
      </p>

      <h2>Liability</h2>
      <p>
        To the maximum extent permitted by law, Call the Case is not liable for
        indirect or consequential damages arising from use of the service.
        Nothing on Call the Case is a substitute for official court records.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; material changes will be announced on this
        page with a new “last updated” date.
      </p>
    </LegalShell>
  );
}
