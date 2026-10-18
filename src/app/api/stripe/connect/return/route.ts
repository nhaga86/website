import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";

export async function GET() {
  const current = await getApiUser();
  if (current?.profile.stripe_account_id) {
    const account = await stripe().accounts.retrieve(current.profile.stripe_account_id);
    await createAdminClient()
      .from("users")
      .update({ stripe_connect_ready: !!account.charges_enabled })
      .eq("id", current.profile.id);
  }
  return NextResponse.redirect(appUrl("/dashboard/settings?tab=payments&connected=1"));
}
