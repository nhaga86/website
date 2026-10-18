import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function hasPaidAccess(profile: Pick<Profile, "plan" | "plan_status" | "is_admin" | "email">) {
  if (profile.is_admin || isAdminEmail(profile.email)) return true;
  if (profile.plan === "lifetime") return true;
  if (profile.plan === "monthly") return ["active", "trialing", "past_due"].includes(profile.plan_status);
  return false;
}

/** Signed-in user plus their profile row. Creates the row if the signup trigger has not run. */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null,
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      })
      .select("*")
      .single<Profile>();
    profile = data;
  }
  if (!profile) return null;
  return { user, profile, isAdmin: profile.is_admin || isAdminEmail(profile.email) };
}

/** For server components: sign-in required, paid plan required, bans enforced. */
export async function requirePaidUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.profile.banned) redirect("/banned");
  if (!hasPaidAccess(current.profile)) redirect("/billing");
  return current;
}

export async function requireAdmin() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/admin");
  if (!current.isAdmin) redirect("/dashboard");
  return current;
}

/** For route handlers: returns null instead of redirecting. */
export async function getApiUser(options: { requirePaid?: boolean; requireAdmin?: boolean } = { requirePaid: true }) {
  const current = await getCurrentUser();
  if (!current || current.profile.banned) return null;
  if (options.requireAdmin && !current.isAdmin) return null;
  if (options.requirePaid && !hasPaidAccess(current.profile)) return null;
  return current;
}
