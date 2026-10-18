import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fulfillPlanCheckout } from "@/lib/fulfillment";
import { stripe } from "@/lib/stripe";

/** Confirms the plan purchase right away instead of waiting for the webhook. */
export default async function BillingSuccess({ searchParams }: { searchParams: { session_id?: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (searchParams.session_id) {
    try {
      const session = await stripe().checkout.sessions.retrieve(searchParams.session_id);
      if (session.metadata?.user_id === current.profile.id) await fulfillPlanCheckout(session);
    } catch (e) {
      console.error("Could not confirm checkout", e);
    }
  }
  redirect("/dashboard?welcome=1");
}
