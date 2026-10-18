import "server-only";
import type { Profile } from "@/lib/types";

/** Adds a subscriber to a Kit (ConvertKit) form using the v4 API. */
export async function addToConvertKit(apiKey: string, formId: string, email: string, firstName?: string | null) {
  const headers = { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey };
  const create = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers,
    body: JSON.stringify({ email_address: email, first_name: firstName || undefined }),
  });
  if (!create.ok && create.status !== 422) throw new Error(`Kit: ${create.status} ${await create.text()}`);
  if (formId) {
    const res = await fetch(`https://api.kit.com/v4/forms/${encodeURIComponent(formId)}/subscribers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email_address: email }),
    });
    if (!res.ok) throw new Error(`Kit form: ${res.status} ${await res.text()}`);
  }
}

export async function addToMailerLite(apiKey: string, groupId: string | null, email: string, name?: string | null) {
  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ email, fields: name ? { name } : undefined, groups: groupId ? [groupId] : undefined }),
  });
  if (!res.ok) throw new Error(`MailerLite: ${res.status} ${await res.text()}`);
}

export async function verifyConvertKit(apiKey: string) {
  const res = await fetch("https://api.kit.com/v4/account", { headers: { "X-Kit-Api-Key": apiKey } });
  return res.ok;
}

export async function verifyMailerLite(apiKey: string) {
  const res = await fetch("https://connect.mailerlite.com/api/groups?limit=1", {
    headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
  });
  return res.ok;
}

/** Pushes one buyer to every email tool the creator connected. Never throws. */
export async function syncSubscriber(
  owner: Pick<Profile, "convertkit_api_key" | "convertkit_form_id" | "mailerlite_api_key" | "mailerlite_group_id">,
  email: string,
  name?: string | null
) {
  const errors: string[] = [];
  if (owner.convertkit_api_key) {
    await addToConvertKit(owner.convertkit_api_key, owner.convertkit_form_id || "", email, name).catch((e) =>
      errors.push(String(e.message || e))
    );
  }
  if (owner.mailerlite_api_key) {
    await addToMailerLite(owner.mailerlite_api_key, owner.mailerlite_group_id, email, name).catch((e) =>
      errors.push(String(e.message || e))
    );
  }
  return errors;
}
