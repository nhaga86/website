import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const current = await getApiUser();
  if (!current?.profile.stripe_account_id) return jsonError("Connect Stripe first", 400);
  const link = await stripe().accounts.createLoginLink(current.profile.stripe_account_id);
  return NextResponse.json({ url: link.url });
}
