import { siteUrl } from "@/lib/env";
import type { PlanId } from "@/lib/plans";
import { getStripe, priceIdFor } from "@/lib/stripe";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server";

// POST /api/stripe/checkout { plan: "monthly" | "yearly" } → { url }
export async function POST(request: Request) {
  const stripe = getStripe();
  const admin = getSupabaseAdmin();
  if (!stripe || !admin) {
    return Response.json({ error: "Payments are not configured yet" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: PlanId };
  const price = priceIdFor(plan === "yearly" ? "yearly" : "monthly");
  if (!price) return Response.json({ error: "Price not configured" }, { status: 503 });

  // Reuse the user's Stripe customer so all their subscriptions live in one place.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  let customer = profile?.stripe_customer_id as string | null | undefined;
  if (!customer) {
    const created = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customer = created.id;
    await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
  }

  const base = siteUrl(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { supabase_user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${base}/learn?checkout=success`,
    cancel_url: `${base}/pricing`,
  });
  return Response.json({ url: session.url });
}
