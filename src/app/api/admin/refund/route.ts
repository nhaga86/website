import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, unauthorized } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/** Full refund of a product sale or a creator's plan payment. */
export async function POST(request: Request) {
  const admin = await getApiUser({ requireAdmin: true });
  if (!admin) return unauthorized();
  const { type, id } = (await request.json().catch(() => ({}))) as { type?: "sale" | "payment"; id?: string };
  if (!id || (type !== "sale" && type !== "payment")) return jsonError("Missing refund target");
  const db = createAdminClient();

  try {
    if (type === "sale") {
      const { data: sale } = await db.from("sales").select("*").eq("id", id).single();
      if (!sale) return jsonError("Sale not found", 404);
      if (sale.status === "refunded") return jsonError("Already refunded");
      if (!sale.stripe_payment_id) return jsonError("No Stripe payment on this sale");
      await stripe().refunds.create({
        payment_intent: sale.stripe_payment_id,
        ...(sale.payout_mode === "connect" ? { reverse_transfer: true, refund_application_fee: true } : {}),
      });
      await db.from("sales").update({ status: "refunded" }).eq("id", id);
      await db.rpc("reverse_product_sale", { p_product_id: sale.product_id, p_amount: sale.amount });
    } else {
      const { data: payment } = await db.from("payments").select("*").eq("id", id).single();
      if (!payment) return jsonError("Payment not found", 404);
      if (payment.status === "refunded") return jsonError("Already refunded");
      if (!payment.stripe_payment_intent_id) return jsonError("No payment intent stored. Refund it from the Stripe dashboard.");
      await stripe().refunds.create({ payment_intent: payment.stripe_payment_intent_id });
      await db.from("payments").update({ status: "refunded" }).eq("id", id);
      if (payment.kind === "lifetime" && payment.user_id) {
        await db.from("users").update({ plan: "free", plan_status: "refunded" }).eq("id", payment.user_id);
      }
    }
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Stripe refund failed", 502);
  }
  return NextResponse.json({ ok: true });
}
