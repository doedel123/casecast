import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy policy" updated="August 30, 2026">
      <p>
        Call the Case collects as little personal data as the product needs — and
        is built so that voting works without an account.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Anonymous voting:</strong> a random session identifier stored
          in a cookie on your device, the outcome you selected, and a salted,
          truncated hash of your IP address used only for abuse detection. We
          do not permanently store plaintext IP addresses.
        </li>
        <li>
          <strong>Accounts:</strong> your email address, an encrypted password
          hash, and an optional display name.
        </li>
        <li>
          <strong>Membership:</strong> payment is processed by Stripe. We never
          see or store your card number; we store your subscription status and
          Stripe customer reference.
        </li>
      </ul>

      <h2>What we use it for</h2>
      <ul>
        <li>Enforcing one prediction per person per case.</li>
        <li>Showing you your own prediction history and accuracy (members).</li>
        <li>Detecting vote manipulation.</li>
        <li>Operating your membership and the donations we report on /impact.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>No sale of personal data, no advertising trackers.</li>
        <li>No public display of who voted for what — results are aggregates.</li>
      </ul>

      <h2>Linking anonymous votes</h2>
      <p>
        If you create an account, predictions made on the same device are
        linked to that account so your history stays intact. This uses the
        same cookie described above.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to or deletion of your account data at{" "}
        <a
          href="mailto:privacy@callthecase.com"
          className="underline underline-offset-2"
        >
          privacy@callthecase.com
        </a>
        . Deleting your account removes your personal data; anonymized vote
        counts remain part of published aggregates.
      </p>

      <h2>Processors</h2>
      <p>
        We use Vercel (hosting), Neon (database), Stripe (payments), and
        Cloudflare Turnstile (bot protection). Each receives only what it
        needs to provide its service.
      </p>
    </LegalShell>
  );
}
