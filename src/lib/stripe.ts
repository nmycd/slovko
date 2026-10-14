import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe ??= new Stripe(key);
  return stripe;
}

export function priceIdFor(plan: PlanId): string | undefined {
  return plan === "yearly" ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
}

export const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];
