import "server-only";

/**
 * Optional: when VERCEL_TOKEN and VERCEL_PROJECT_ID are set, creator domains are
 * added to (and removed from) the Vercel project automatically.
 */
function config() {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) return null;
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  return { token, project, team };
}

export async function addProjectDomain(domain: string) {
  const c = config();
  if (!c) return { ok: true, skipped: true };
  const res = await fetch(`https://api.vercel.com/v10/projects/${c.project}/domains${c.team}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
  if (res.ok || res.status === 409) return { ok: true };
  const body = await res.json().catch(() => ({}));
  return { ok: false, error: (body as { error?: { message?: string } }).error?.message || `Vercel error ${res.status}` };
}

export async function removeProjectDomain(domain: string) {
  const c = config();
  if (!c) return;
  await fetch(`https://api.vercel.com/v9/projects/${c.project}/domains/${domain}${c.team}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${c.token}` },
  }).catch(() => null);
}
