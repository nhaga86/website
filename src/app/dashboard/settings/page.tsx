import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUser } from "@/lib/auth";
import { platformFeePercent } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: { tab?: string; connected?: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const { profile } = current;
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host;
  return (
    <div>
      <PageHeader title="Settings" description="Profile, payouts, email tools, domain and billing." />
      <SettingsClient
        tab={searchParams.tab || "profile"}
        justConnected={!!searchParams.connected}
        appHost={appHost}
        feePercent={platformFeePercent()}
        profile={{
          email: profile.email,
          full_name: profile.full_name,
          plan: profile.plan,
          plan_status: profile.plan_status,
          has_billing: !!profile.stripe_customer_id,
          stripe_account_id: profile.stripe_account_id,
          stripe_connect_ready: profile.stripe_connect_ready,
          convertkit_connected: !!profile.convertkit_api_key,
          convertkit_form_id: profile.convertkit_form_id,
          mailerlite_connected: !!profile.mailerlite_api_key,
          mailerlite_group_id: profile.mailerlite_group_id,
          custom_domain: profile.custom_domain,
        }}
      />
    </div>
  );
}
