import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Chapter, Product, Profile } from "@/lib/types";

export async function getPublicProduct(slug: string) {
  const db = createAdminClient();
  const { data: product } = await db.from("products").select("*").eq("slug", slug).maybeSingle<Product>();
  if (!product) return null;
  const [{ data: chapters }, { data: owner }] = await Promise.all([
    db.from("chapters").select("title, summary, chapter_number").eq("product_id", product.id).order("chapter_number").returns<Pick<Chapter, "title" | "summary" | "chapter_number">[]>(),
    db.from("users").select("id, banned, custom_domain, full_name").eq("id", product.user_id).single<Pick<Profile, "id" | "banned" | "custom_domain" | "full_name">>(),
  ]);
  if (!owner || owner.banned) return null;

  // On a custom domain, only show products that belong to the domain owner
  const domain = headers().get("x-custom-domain");
  if (domain && owner.custom_domain?.toLowerCase() !== domain) return null;

  return { product, chapters: chapters ?? [], owner };
}
