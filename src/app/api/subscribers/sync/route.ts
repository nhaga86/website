import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, unauthorized } from "@/lib/api";
import { addToConvertKit, addToMailerLite } from "@/lib/integrations";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/** Pushes the existing buyer list to Kit or MailerLite. */
export async function POST(request: Request) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const { provider } = (await request.json().catch(() => ({}))) as { provider?: "convertkit" | "mailerlite" };
  const p = current.profile;
  if (provider === "convertkit" && !p.convertkit_api_key) return jsonError("Add your Kit API key in settings first");
  if (provider === "mailerlite" && !p.mailerlite_api_key) return jsonError("Add your MailerLite API key in settings first");
  if (provider !== "convertkit" && provider !== "mailerlite") return jsonError("Unknown provider");

  const { data: subs } = await createClient().from("subscribers").select("email, name").limit(1000);
  const unique = Array.from(new Map((subs ?? []).map((s) => [s.email, s])).values());
  let synced = 0;
  const errors: string[] = [];
  // Small batches keep us under both providers' rate limits
  for (let i = 0; i < unique.length; i += 5) {
    await Promise.all(
      unique.slice(i, i + 5).map(async (s) => {
        try {
          if (provider === "convertkit") await addToConvertKit(p.convertkit_api_key!, p.convertkit_form_id || "", s.email, s.name);
          else await addToMailerLite(p.mailerlite_api_key!, p.mailerlite_group_id, s.email, s.name);
          synced++;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
        }
      })
    );
  }
  return NextResponse.json({ synced, failed: errors.length, error: errors[0] });
}
