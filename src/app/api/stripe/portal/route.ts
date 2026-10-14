import { siteUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server";

// POST /api/stripe/portal → { url } of the Stripe customer portal
// (change plan, update card, cancel, invoices).
export async function POST(request: Request) {
  const stripe = getStripe();
  const admin = getSupabaseAdmin();
  if (!stripe || !admin) {
    return Response.json({ error: "Payments are not configured yet" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) {
    return Response.json({ error: "No billing account yet" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl(request)}/account`,
  });
  return Response.json({ url: session.url });
}
