import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";

export async function POST() {
  const current = await getApiUser({ requirePaid: false });
  if (!current) return jsonError("Sign in first", 401);
  if (!current.profile.stripe_customer_id) return jsonError("No billing account yet");
  const session = await stripe().billingPortal.sessions.create({
    customer: current.profile.stripe_customer_id,
    return_url: appUrl("/dashboard/settings?tab=billing"),
  });
  return NextResponse.json({ url: session.url });
}
