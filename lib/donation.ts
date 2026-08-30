export type DonationSettings = {
  mode: "fixed_per_membership" | "percent_revenue" | "net_proceeds";
  fixedCentsPerMembership: number;
  percent: number;
  charityId: string | null;
  methodology: string;
};

export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  mode: "fixed_per_membership",
  fixedCentsPerMembership: 100,
  percent: 20,
  charityId: null,
  methodology:
    "Donations are calculated at the end of each calendar month based on paid, non-refunded memberships active during that month, and transferred within 15 days. Receipts are published on this page.",
};

export function donationStatement(
  settings: DonationSettings,
  charityName: string | null,
): string {
  const to = charityName ? ` to ${charityName}` : " to our partner charity";
  switch (settings.mode) {
    case "fixed_per_membership": {
      const amount = (settings.fixedCentsPerMembership / 100).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          minimumFractionDigits:
            settings.fixedCentsPerMembership % 100 === 0 ? 0 : 2,
        },
      );
      return `${amount} from every monthly membership is donated${to}.`;
    }
    case "percent_revenue":
      return `${settings.percent}% of membership revenue is donated${to}.`;
    case "net_proceeds":
      return `100% of net proceeds are donated${to}.`;
  }
}
