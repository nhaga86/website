import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, unauthorized } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getApiUser({ requireAdmin: true });
  if (!admin) return unauthorized();
  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  if (params.id === admin.profile.id && action === "ban") return jsonError("You cannot ban yourself");
  const db = createAdminClient();

  switch (action) {
    case "ban":
      await db.from("users").update({ banned: true }).eq("id", params.id);
      await db.auth.admin.updateUserById(params.id, { ban_duration: "876000h" });
      break;
    case "unban":
      await db.from("users").update({ banned: false }).eq("id", params.id);
      await db.auth.admin.updateUserById(params.id, { ban_duration: "none" });
      break;
    case "grant_lifetime":
      await db.from("users").update({ plan: "lifetime", plan_status: "active" }).eq("id", params.id);
      break;
    case "revoke_plan":
      await db.from("users").update({ plan: "free", plan_status: "revoked" }).eq("id", params.id);
      break;
    case "make_admin":
      await db.from("users").update({ is_admin: true }).eq("id", params.id);
      break;
    case "remove_admin":
      await db.from("users").update({ is_admin: false }).eq("id", params.id);
      break;
    default:
      return jsonError("Unknown action");
  }
  return NextResponse.json({ ok: true });
}
