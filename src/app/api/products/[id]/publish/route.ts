import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { buildEbookPdf } from "@/lib/pdf";
import { getOwnedProductWithChapters } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/** Publishes (building the PDF first when needed) or unpublishes a product. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const { publish = true } = (await request.json().catch(() => ({}))) as { publish?: boolean };
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) return notFound();
  const { product, chapters } = data;
  const supabase = createClient();

  if (!publish) {
    await supabase.from("products").update({ status: "draft" }).eq("id", product.id);
    return NextResponse.json({ status: "draft" });
  }

  if (!chapters.some((c) => c.content.trim())) return jsonError("Write at least one chapter before publishing");

  // Always rebuild so buyers get the latest edits
  const pdf = await buildEbookPdf(product, chapters, product.sales_page?.author_name || current.profile.full_name);
  const path = `${current.profile.id}/${product.id}.pdf`;
  const upload = await createAdminClient().storage.from("ebooks").upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upload.error) return jsonError(upload.error.message, 500);
  const now = new Date().toISOString();
  const updates = { status: "published", published_at: product.published_at ?? now, pdf_path: path, pdf_generated_at: now };

  const { error } = await supabase.from("products").update(updates).eq("id", product.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ status: "published", slug: product.slug });
}
