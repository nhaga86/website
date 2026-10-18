import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { jsonError, unauthorized } from "@/lib/api";
import { verifyConvertKit, verifyMailerLite } from "@/lib/integrations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { addProjectDomain, removeProjectDomain } from "@/lib/vercel";

const schema = z
  .object({
    full_name: z.string().max(120).nullable(),
    convertkit_api_key: z.string().max(200).nullable(),
    convertkit_form_id: z.string().max(60).nullable(),
    mailerlite_api_key: z.string().max(2000).nullable(),
    mailerlite_group_id: z.string().max(60).nullable(),
    custom_domain: z.string().max(253).nullable(),
  })
  .partial();

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export async function PATCH(request: Request) {
  const current = await getApiUser({ requirePaid: false });
  if (!current) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Invalid settings");
  const updates: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(parsed.data)) updates[k] = typeof v === "string" ? v.trim() || null : v ?? null;

  if (updates.convertkit_api_key && !(await verifyConvertKit(updates.convertkit_api_key))) {
    return jsonError("Kit rejected that API key. Use a v4 API key from Settings > Developer in Kit.");
  }
  if (updates.mailerlite_api_key && !(await verifyMailerLite(updates.mailerlite_api_key))) {
    return jsonError("MailerLite rejected that API key.");
  }
  if ("custom_domain" in updates && updates.custom_domain) {
    const domain = updates.custom_domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").hostname;
    if (!DOMAIN_RE.test(domain) || domain === appHost) return jsonError("Enter a domain like books.yoursite.com");
    const { data: taken } = await createAdminClient().from("users").select("id").eq("custom_domain", domain).neq("id", current.profile.id).maybeSingle();
    if (taken) return jsonError("That domain is connected to another account");
    updates.custom_domain = domain;
    if (domain !== current.profile.custom_domain) {
      const added = await addProjectDomain(domain);
      if (!added.ok) return jsonError(added.error || "Could not register the domain");
    }
  }
  if ("custom_domain" in updates && current.profile.custom_domain && updates.custom_domain !== current.profile.custom_domain) {
    await removeProjectDomain(current.profile.custom_domain);
  }

  const { data, error } = await createClient().from("users").update(updates).eq("id", current.profile.id).select("*").single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ profile: data });
}
