import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";

/** Creates (or resumes) Stripe Connect Express onboarding for the creator. */
export async function POST() {
  const current = await getApiUser();
  if (!current) return jsonError("Sign in first", 401);
  const { profile } = current;
  const s = stripe();

  let accountId = profile.stripe_account_id;
  if (!accountId) {
    const account = await s.accounts.create({
      type: "express",
      email: profile.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { user_id: profile.id },
    });
    accountId = account.id;
    await createAdminClient().from("users").update({ stripe_account_id: accountId }).eq("id", profile.id);
  }

  const link = await s.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: appUrl("/dashboard/settings?tab=payments"),
    return_url: appUrl("/api/stripe/connect/return"),
  });
  return NextResponse.json({ url: link.url });
}

/** Disconnects the Stripe account from this platform user. */
export async function DELETE() {
  const current = await getApiUser();
  if (!current) return jsonError("Sign in first", 401);
  await createAdminClient()
    .from("users")
    .update({ stripe_account_id: null, stripe_connect_ready: false })
    .eq("id", current.profile.id);
  return NextResponse.json({ ok: true });
}
