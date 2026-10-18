import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDeliveryEmail } from "@/lib/email";
import { syncSubscriber } from "@/lib/integrations";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";
import type { Product, Profile } from "@/lib/types";

export function downloadUrl(sessionId: string) {
  return appUrl(`/api/download?session_id=${encodeURIComponent(sessionId)}`);
}

/**
 * Records a product purchase, emails the buyer and syncs them to the creator's
 * email tool. Safe to call more than once for the same session.
 */
export async function fulfillProductCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return { fulfilled: false, reason: "unpaid" };
  const productId = session.metadata?.product_id;
  if (!productId) return { fulfilled: false, reason: "no product" };

  const db = createAdminClient();
  const { data: product } = await db.from("products").select("*").eq("id", productId).single<Product>();
  if (!product) return { fulfilled: false, reason: "product missing" };

  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  if (!email) return { fulfilled: false, reason: "no email" };
  const name = session.customer_details?.name || null;
  const amount = session.amount_total ?? product.price_cents;
  const fee = Number(session.metadata?.platform_fee ?? 0);
  const payoutMode = session.metadata?.payout_mode === "connect" ? "connect" : "platform";
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const { data: inserted, error } = await db
    .from("sales")
    .upsert(
      {
        product_id: product.id,
        buyer_email: email,
        buyer_name: name,
        amount,
        platform_fee: fee,
        currency: session.currency || "usd",
        stripe_payment_id: paymentIntent ?? null,
        stripe_checkout_session_id: session.id,
        payout_mode: payoutMode,
        payout_status: payoutMode === "connect" ? "not_applicable" : "pending",
      },
      { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true }
    )
    .select("id");
  if (error) throw error;
  if (!inserted || inserted.length === 0) return { fulfilled: false, reason: "already fulfilled" };

  await db.rpc("record_product_sale", { p_product_id: product.id, p_amount: amount });
  await db
    .from("subscribers")
    .upsert({ product_id: product.id, email, name, purchased_at: new Date().toISOString() }, { onConflict: "product_id,email" });

  const { data: owner } = await db.from("users").select("*").eq("id", product.user_id).single<Profile>();

  try {
    await sendDeliveryEmail({
      to: email,
      buyerName: name,
      productTitle: product.title,
      downloadUrl: downloadUrl(session.id),
      sellerName: product.sales_page?.author_name || product.brand_name || owner?.full_name,
      brandColor: product.brand_colors?.primary,
      coverUrl: product.cover_url,
    });
  } catch (e) {
    console.error("Delivery email failed", e);
  }

  if (owner) {
    const errors = await syncSubscriber(owner, email, name);
    if (errors.length) console.error("Email integration sync failed", errors);
  }

  return { fulfilled: true };
}

/** Grants plan access after the creator pays the platform. */
export async function fulfillPlanCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id || session.client_reference_id;
  const plan = session.metadata?.plan;
  if (!userId || (plan !== "monthly" && plan !== "lifetime")) return;
  const db = createAdminClient();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (plan === "lifetime") {
    if (session.payment_status !== "paid") return;
    await db
      .from("users")
      .update({ plan: "lifetime", plan_status: "active", ...(customerId ? { stripe_customer_id: customerId } : {}) })
      .eq("id", userId);
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    await db.from("payments").upsert(
      {
        user_id: userId,
        kind: "lifetime",
        amount: session.amount_total ?? 19000,
        currency: session.currency || "usd",
        stripe_payment_intent_id: paymentIntent ?? null,
        stripe_checkout_session_id: session.id,
      },
      { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true }
    );
    // Lifetime replaces any running monthly subscription
    const { data: profile } = await db.from("users").select("stripe_subscription_id").eq("id", userId).single();
    if (profile?.stripe_subscription_id) {
      await stripe().subscriptions.cancel(profile.stripe_subscription_id).catch(() => null);
      await db.from("users").update({ stripe_subscription_id: null }).eq("id", userId);
    }
    return;
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return;
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const { data: current } = await db.from("users").select("plan").eq("id", userId).single();
  if (current?.plan === "lifetime") return;
  await db
    .from("users")
    .update({
      plan: "monthly",
      plan_status: sub.status,
      stripe_subscription_id: sub.id,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
    })
    .eq("id", userId);
}
