import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillPlanCheckout, fulfillProductCheckout } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

function verify(body: string, signature: string): Stripe.Event {
  // One endpoint can receive platform events and Connect events, each with its own secret.
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean) as string[];
  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe().webhooks.constructEvent(body, signature, secret);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("STRIPE_WEBHOOK_SECRET is not set");
}

async function handleSubscription(sub: Stripe.Subscription, deleted = false) {
  const db = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { data: user } = await db.from("users").select("id, plan, stripe_subscription_id").eq("stripe_customer_id", customerId).maybeSingle();
  if (!user || user.plan === "lifetime") return;
  // Ignore events for an older subscription after the user started a new one
  if (user.stripe_subscription_id && user.stripe_subscription_id !== sub.id && deleted) return;
  const ended = deleted || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
  await db
    .from("users")
    .update({
      plan: ended ? "free" : "monthly",
      plan_status: ended ? "canceled" : sub.status,
      stripe_subscription_id: ended ? null : sub.id,
    })
    .eq("id", user.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.customer || !invoice.amount_paid) return;
  const db = createAdminClient();
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
  const { data: user } = await db.from("users").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  if (!user) return;
  let paymentIntent: string | null = null;
  try {
    const payments = await stripe().invoicePayments.list({ invoice: invoice.id!, limit: 1 });
    const pi = payments.data[0]?.payment?.payment_intent;
    paymentIntent = typeof pi === "string" ? pi : pi?.id ?? null;
  } catch {
    // Older API versions expose the payment intent elsewhere; refunds then go through the Stripe dashboard.
  }
  await db.from("payments").upsert(
    {
      user_id: user.id,
      kind: "monthly",
      amount: invoice.amount_paid,
      currency: invoice.currency,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: paymentIntent,
    },
    { onConflict: "stripe_invoice_id", ignoreDuplicates: true }
  );
}

async function handleRefund(charge: Stripe.Charge) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi || !charge.refunded) return;
  const db = createAdminClient();

  const { data: sales } = await db.from("sales").select("id, product_id, amount, status").eq("stripe_payment_id", pi);
  for (const sale of sales ?? []) {
    if (sale.status === "refunded") continue;
    await db.from("sales").update({ status: "refunded" }).eq("id", sale.id);
    await db.rpc("reverse_product_sale", { p_product_id: sale.product_id, p_amount: sale.amount });
  }

  const { data: payments } = await db.from("payments").select("id, user_id, kind, status").eq("stripe_payment_intent_id", pi);
  for (const p of payments ?? []) {
    if (p.status === "refunded") continue;
    await db.from("payments").update({ status: "refunded" }).eq("id", p.id);
    if (p.kind === "lifetime" && p.user_id) {
      await db.from("users").update({ plan: "free", plan_status: "refunded" }).eq("id", p.user_id);
    }
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = verify(body, signature);
  } catch (e) {
    console.error("Stripe signature check failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.metadata?.type === "product") await fulfillProductCheckout(session);
        else if (session.metadata?.type === "plan") await fulfillPlanCheckout(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscription(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscription(event.data.object, true);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
      case "account.updated": {
        const account = event.data.object;
        await createAdminClient()
          .from("users")
          .update({ stripe_connect_ready: !!account.charges_enabled })
          .eq("stripe_account_id", account.id);
        break;
      }
    }
  } catch (e) {
    console.error(`Webhook ${event.type} failed`, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
