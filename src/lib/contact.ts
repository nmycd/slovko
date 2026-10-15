// The contact form (/contact) and its route (/api/contact): field limits both
// sides check, and the error codes the route answers with.

export const contactLimits = {
  name: 100,
  email: 254,
  messageMin: 10,
  messageMax: 5000,
} as const;

/** Why /api/contact refused a message. */
export type ContactError = "invalid" | "too_fast" | "rate_limited" | "unavailable" | "failed";

/** A plausible address: something@domain.tld, no spaces. Real checking is the reply. */
export function isPlausibleEmail(email: string): boolean {
  return email.length <= contactLimits.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
