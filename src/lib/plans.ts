// Displayed prices. Keep these in sync with the Prices in your Stripe
// dashboard; the amount actually charged comes from Stripe.
export const plans = {
  monthly: { label: "Monthly", price: "€6.99", per: "month", note: "Cancel anytime" },
  yearly: { label: "Yearly", price: "€59.99", per: "year", note: "2 months free" },
} as const;

export type PlanId = keyof typeof plans;

export const premiumPerks = [
  "Units 3–10 of the A1 course",
  "New lessons as they're released",
  "Support a small Slovak-learning project",
];

export const FREE_UNIT_COUNT = 2;
