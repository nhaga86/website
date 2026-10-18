import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { getOwnedProductWithChapters, uniqueSlug } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) return notFound();
  const { product, chapters } = data;
  const supabase = createClient();

  const copyable = {
    user_id: product.user_id,
    subtitle: product.subtitle,
    description: product.description,
    brand_colors: product.brand_colors,
    font: product.font,
    cover_url: product.cover_url,
    cover_prompt: product.cover_prompt,
    cover_overlay: product.cover_overlay,
    sales_page_template: product.sales_page_template,
    sales_page: product.sales_page,
    price_cents: product.price_cents,
    currency: product.currency,
    idea: product.idea,
    audience: product.audience,
    tone: product.tone,
    title_options: product.title_options,
    brand_names: product.brand_names,
    brand_name: product.brand_name,
    color_suggestions: product.color_suggestions,
  };
  const { data: copy, error } = await supabase
    .from("products")
    .insert({ ...copyable, title: `${product.title} (copy)`, slug: await uniqueSlug(`${product.slug}-copy`), status: "draft" })
    .select("id")
    .single();
  if (error || !copy) return jsonError(error?.message || "Could not duplicate", 500);

  if (chapters.length) {
    await supabase.from("chapters").insert(
      chapters.map((c) => ({ product_id: copy.id, chapter_number: c.chapter_number, title: c.title, summary: c.summary, content: c.content }))
    );
  }
  return NextResponse.json({ id: copy.id });
}
