import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";

/** Starts a Stripe Checkout session for the $20/mo or $190 lifetime plan. */
export async function POST(request: Request) {
  const current = await getApiUser({ requirePaid: false });
  if (!current) return jsonError("Sign in first", 401);
  const { plan } = (await request.json().catch(() => ({}))) as { plan?: string };
  if (plan !== "monthly" && plan !== "lifetime") return jsonError("Choose monthly or lifetime");
  const { profile } = current;
  if (profile.plan === "lifetime") return jsonError("You already have lifetime access");

  const s = stripe();
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await s.customers.create({
      email: profile.email,
      name: profile.full_name || undefined,
      metadata: { user_id: profile.id },
    });
    customerId = customer.id;
    await createAdminClient().from("users").update({ stripe_customer_id: customerId }).eq("id", profile.id);
  }

  const metadata = { type: "plan", plan, user_id: profile.id };
  const priceId = plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_LIFETIME;

  const session = await s.checkout.sessions.create({
    mode: plan === "monthly" ? "subscription" : "payment",
    customer: customerId,
    client_reference_id: profile.id,
    allow_promotion_codes: true,
    metadata,
    ...(plan === "monthly" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: PLANS[plan].amount,
              product_data: { name: PLANS[plan].name },
              ...(plan === "monthly" ? { recurring: { interval: "month" as const } } : {}),
            },
          },
    ],
    success_url: appUrl("/billing/success?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: appUrl(`/billing?plan=${plan}&canceled=1`),
  });

  return NextResponse.json({ url: session.url });
}
