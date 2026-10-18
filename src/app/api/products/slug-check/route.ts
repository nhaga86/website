import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api";
import { RESERVED_SLUGS } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const { searchParams } = new URL(request.url);
  const slug = slugify(searchParams.get("slug") || "");
  const id = searchParams.get("id") || "";
  if (slug.length < 2 || RESERVED_SLUGS.has(slug)) return NextResponse.json({ slug, available: false });
  let q = createAdminClient().from("products").select("id").eq("slug", slug);
  if (id) q = q.neq("id", id);
  const { data } = await q.maybeSingle();
  return NextResponse.json({ slug, available: !data });
}
