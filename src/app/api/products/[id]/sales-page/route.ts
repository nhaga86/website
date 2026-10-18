import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { generateSalesPageCopy } from "@/lib/openai";
import { getOwnedProductWithChapters } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/** Fills the sales page with AI copy, FAQ and placeholder testimonials. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) return notFound();
  const { product, chapters } = data;

  try {
    const copy = await generateSalesPageCopy({
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      audience: product.audience,
      tone: product.tone,
      chapters: chapters.map((c) => c.title),
      authorName: product.sales_page?.author_name || current.profile.full_name,
    });
    const sales_page = {
      ...product.sales_page,
      ...copy,
      author_name: product.sales_page?.author_name || current.profile.full_name || "",
    };
    await createClient().from("products").update({ sales_page }).eq("id", product.id);
    return NextResponse.json({ sales_page });
  } catch (e) {
    console.error(e);
    return jsonError("Could not write the sales page", 502);
  }
}
