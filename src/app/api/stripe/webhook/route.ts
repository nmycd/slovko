import type Stripe from "stripe";
import { ACTIVE_STATUSES, getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// POST /api/stripe/webhook
// Stripe is the source of truth for premium: every subscription change is
// mirrored into `subscriptions`, and `profiles.is_premium` is recomputed.
export async function POST(request: Request) {
  const stripe = getStripe();
  const admin = getSupabaseAdmin();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !admin || !secret) {
    return Response.json({ error: "Payments are not configured yet" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", secret);
  } catch (err) {
    return Response.json({ error: `Bad signature: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(sub, session.client_reference_id);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
  }
  return Response.json({ received: true });

  async function syncSubscription(sub: Stripe.Subscription, fallbackUserId?: string | null) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    let userId = sub.metadata.supabase_user_id || fallbackUserId || null;
    if (!userId) {
      const { data } = await admin!
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      userId = data?.id ?? null;
    }
    if (!userId) {
      console.error(`Stripe webhook: no user for customer ${customerId}`);
      return;
    }

    const item = sub.items.data[0];
    const { error } = await admin!.from("subscriptions").upsert({
      id: sub.id,
      user_id: userId,
      status: sub.status,
      price_id: item?.price.id ?? null,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);

    // A user is premium if any of their subscriptions is active.
    const { data: subs } = await admin!.from("subscriptions").select("status").eq("user_id", userId);
    const isPremium = (subs ?? []).some((s) =>
      ACTIVE_STATUSES.includes(s.status as Stripe.Subscription.Status),
    );
    await admin!
      .from("profiles")
      .update({ is_premium: isPremium, stripe_customer_id: customerId })
      .eq("id", userId);
  }
}
