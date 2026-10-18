import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFee, stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Buy button endpoint. A plain link to this URL opens Stripe Checkout, so it works
 * on the sales page and as an embeddable button on any other site.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const db = createAdminClient();
  const { data: product } = await db.from("products").select("*").eq("slug", params.slug).eq("status", "published").maybeSingle<Product>();
  if (!product) return NextResponse.redirect(appUrl("/"), 303);
  const { data: owner } = await db.from("users").select("banned, stripe_account_id, stripe_connect_ready").eq("id", product.user_id).single();
  if (!owner || owner.banned) return NextResponse.redirect(appUrl("/"), 303);

  const fee = platformFee(product.price_cents);
  const useConnect = !!(owner.stripe_account_id && owner.stripe_connect_ready);
  const metadata = {
    type: "product",
    product_id: product.id,
    payout_mode: useConnect ? "connect" : "platform",
    platform_fee: String(fee),
  };
  const image = product.cover_url?.startsWith("https://") ? [product.cover_url] : undefined;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    metadata,
    payment_intent_data: {
      metadata,
      ...(useConnect ? { application_fee_amount: fee, transfer_data: { destination: owner.stripe_account_id! } } : {}),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: product.price_cents,
          product_data: { name: product.title, description: product.subtitle || undefined, images: image },
        },
      },
    ],
    success_url: appUrl(`/p/${product.slug}/thank-you?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: appUrl(`/p/${product.slug}`),
  });

  return NextResponse.redirect(session.url!, 303);
}
