import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomSuffix, slugify } from "@/lib/utils";
import type { Chapter, Product } from "@/lib/types";

/** Loads a product only if it belongs to the signed-in user (RLS enforced). */
export async function getOwnedProduct(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle<Product>();
  return data;
}

export async function getOwnedProductWithChapters(id: string) {
  const supabase = createClient();
  const [{ data: product }, { data: chapters }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle<Product>(),
    supabase.from("chapters").select("*").eq("product_id", id).order("chapter_number").returns<Chapter[]>(),
  ]);
  if (!product) return null;
  return { product, chapters: chapters ?? [] };
}

export async function uniqueSlug(base: string, excludeId?: string) {
  const db = createAdminClient();
  const root = slugify(base) || "product";
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? root : `${root}-${randomSuffix(4)}`;
    let query = db.from("products").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export const RESERVED_SLUGS = new Set(["admin", "api", "dashboard", "login", "signup", "billing", "new"]);
