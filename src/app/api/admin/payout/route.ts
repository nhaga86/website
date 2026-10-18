import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, unauthorized } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

/** Marks platform-collected sales as paid out to the creator. */
export async function POST(request: Request) {
  const admin = await getApiUser({ requireAdmin: true });
  if (!admin) return unauthorized();
  const { saleIds } = (await request.json().catch(() => ({}))) as { saleIds?: string[] };
  if (!saleIds?.length) return jsonError("No sales selected");
  const { error } = await createAdminClient()
    .from("sales")
    .update({ payout_status: "paid" })
    .in("id", saleIds)
    .eq("payout_mode", "platform");
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
