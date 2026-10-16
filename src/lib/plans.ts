import type { MessageKey } from "@/lib/i18n";

// Displayed prices. Keep these in sync with the Prices in your Stripe
// dashboard; the amount actually charged comes from Stripe. Labels are
// message keys (src/lib/i18n/messages).
export const plans = {
  monthly: { label: "pricing.monthly", price: "€9.99", per: "pricing.perMonth", note: "pricing.note.monthly" },
  yearly: { label: "pricing.yearly", price: "€99.99", per: "pricing.perYear", note: "pricing.note.yearly" },
} as const satisfies Record<string, { label: MessageKey; price: string; per: MessageKey; note: MessageKey }>;

export type PlanId = keyof typeof plans;

export const premiumPerks: MessageKey[] = ["pricing.perk1", "pricing.perk2", "pricing.perk3"];

export const FREE_UNIT_COUNT = 2;
