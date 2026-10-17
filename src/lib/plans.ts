import { courseById, courses } from "@/lib/course/courses";
import type { MessageKey } from "@/lib/i18n";

// Displayed prices. Keep these in sync with the Prices in your Stripe
// dashboard; the amount actually charged comes from Stripe. Labels are
// message keys (src/lib/i18n/messages).
export const plans = {
  monthly: { label: "pricing.monthly", price: "€9.99", per: "pricing.perMonth", note: "pricing.note.monthly" },
  yearly: { label: "pricing.yearly", price: "€99.99", per: "pricing.perYear", note: "pricing.note.yearly" },
} as const satisfies Record<string, { label: MessageKey; price: string; per: MessageKey; note: MessageKey }>;

export type PlanId = keyof typeof plans;

/** What Premium gives: A1's later units, every later course once it's launched, and the rest. */
export const premiumPerks: { key: MessageKey; vars?: Record<string, string> }[] = [
  { key: "pricing.perk1" },
  ...courses
    .filter((c) => c.id !== "a1" && c.launched)
    .map((c) => ({ key: "pricing.perkCourse" as const, vars: { level: c.level } })),
  { key: "pricing.perk2" },
  { key: "pricing.perk3" },
];

/** A1's free units. */
export const FREE_UNIT_COUNT = courseById("a1").freeUnits;
