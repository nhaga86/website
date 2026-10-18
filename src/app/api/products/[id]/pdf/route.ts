import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { buildEbookPdf } from "@/lib/pdf";
import { getOwnedProduct, getOwnedProductWithChapters } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/** Builds the PDF with jsPDF and stores it in the private ebooks bucket. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) return notFound();
  if (!data.chapters.some((c) => c.content.trim())) return jsonError("Write at least one chapter first");

  const pdf = await buildEbookPdf(data.product, data.chapters, data.product.sales_page?.author_name || current.profile.full_name);
  const path = `${current.profile.id}/${data.product.id}.pdf`;
  const { error } = await createAdminClient()
    .storage.from("ebooks")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (error) return jsonError(error.message, 500);

  const generatedAt = new Date().toISOString();
  await createClient().from("products").update({ pdf_path: path, pdf_generated_at: generatedAt }).eq("id", data.product.id);
  return NextResponse.json({ pdf_path: path, pdf_generated_at: generatedAt, size: pdf.length });
}

/** Owner preview: short lived signed link to the current PDF. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser({ requirePaid: false });
  if (!current) return unauthorized();
  const product = await getOwnedProduct(params.id);
  if (!product?.pdf_path) return notFound();
  const { data, error } = await createAdminClient()
    .storage.from("ebooks")
    .createSignedUrl(product.pdf_path, 60 * 10, { download: `${product.slug}.pdf` });
  if (error || !data) return jsonError(error?.message || "Could not sign link", 500);
  return NextResponse.redirect(data.signedUrl);
}
