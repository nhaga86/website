import { redirect } from "next/navigation";
import { getCurrentUser, hasPaidAccess } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { PlanPicker } from "./plan-picker";

export const metadata = { title: "Choose a plan" };

export default async function BillingPage({ searchParams }: { searchParams: { plan?: string; canceled?: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/billing");
  if (current.profile.banned) redirect("/banned");
  if (hasPaidAccess(current.profile)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
        </form>
      </div>
      <div className="container max-w-3xl py-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Unlock the builder</h1>
        <p className="mt-3 text-muted-foreground">Pick a plan to start creating. Signed in as {current.profile.email}.</p>
        {searchParams.canceled && (
          <p className="mx-auto mt-6 w-fit rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">Checkout canceled. No charge was made.</p>
        )}
        <PlanPicker initial={searchParams.plan === "lifetime" ? "lifetime" : "monthly"} />
      </div>
    </div>
  );
}
