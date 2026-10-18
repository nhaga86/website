import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillProductCheckout } from "@/lib/fulfillment";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Buyer download link. Each click signs a fresh 10 minute URL to the private PDF. */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const db = createAdminClient();

  let { data: sale } = await db.from("sales").select("product_id, status").eq("stripe_checkout_session_id", sessionId).maybeSingle();
  if (!sale) {
    // The webhook may still be on its way. Confirm the payment with Stripe directly.
    const session = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
    if (session?.metadata?.type === "product" && session.payment_status === "paid") {
      await fulfillProductCheckout(session);
      ({ data: sale } = await db.from("sales").select("product_id, status").eq("stripe_checkout_session_id", sessionId).maybeSingle());
    }
  }
  if (!sale || sale.status !== "paid") return NextResponse.json({ error: "No paid order found for this link" }, { status: 404 });

  const { data: product } = await db.from("products").select("slug, pdf_path").eq("id", sale.product_id).single();
  if (!product?.pdf_path) return NextResponse.redirect(appUrl("/"), 303);
  const { data: signed, error } = await db.storage
    .from("ebooks")
    .createSignedUrl(product.pdf_path, 600, { download: `${product.slug}.pdf` });
  if (error || !signed) return NextResponse.json({ error: "Download unavailable, try again" }, { status: 500 });
  return NextResponse.redirect(signed.signedUrl, 303);
}
