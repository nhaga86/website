import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { getOwnedProduct, RESERVED_SLUGS } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FONT_PAIRINGS } from "@/lib/fonts";
import { slugify } from "@/lib/utils";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const productSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    subtitle: z.string().max(300).nullable(),
    description: z.string().max(5000).nullable(),
    brand_colors: z.object({ primary: hex, secondary: hex, accent: hex }),
    font: z.string().refine((v) => FONT_PAIRINGS.some((f) => f.id === v)),
    cover_url: z.string().url().nullable(),
    cover_prompt: z.string().max(4000).nullable(),
    cover_overlay: z.boolean(),
    sales_page_template: z.enum(["classic", "bold", "minimal"]),
    sales_page: z.record(z.string(), z.unknown()),
    price_cents: z.number().int().min(100).max(100000000),
    brand_name: z.string().max(120).nullable(),
    slug: z.string().min(2).max(80),
  })
  .partial();

const bodySchema = z.object({
  product: productSchema.optional(),
  chapters: z
    .array(z.object({ id: z.string().uuid(), title: z.string().max(300).optional(), content: z.string().max(200000).optional() }))
    .optional(),
  new_chapters: z.array(z.object({ title: z.string().max(300), content: z.string().max(200000).default("") })).optional(),
  delete_chapters: z.array(z.string().uuid()).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const product = await getOwnedProduct(params.id);
  if (!product) return notFound();
  const { data: chapters } = await createClient().from("chapters").select("*").eq("product_id", product.id).order("chapter_number");
  return NextResponse.json({ product, chapters });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const product = await getOwnedProduct(params.id);
  if (!product) return notFound();

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid data");
  const { product: updates, chapters, new_chapters, delete_chapters } = parsed.data;
  const supabase = createClient();

  if (updates && Object.keys(updates).length) {
    if (updates.slug !== undefined) {
      const slug = slugify(updates.slug);
      if (slug.length < 2 || RESERVED_SLUGS.has(slug)) return jsonError("Pick a different link");
      const { data: taken } = await createAdminClient().from("products").select("id").eq("slug", slug).neq("id", product.id).maybeSingle();
      if (taken) return jsonError("That link is taken");
      updates.slug = slug;
    }
    if (updates.sales_page) updates.sales_page = { ...product.sales_page, ...updates.sales_page };
    const { error } = await supabase.from("products").update(updates).eq("id", product.id);
    if (error) return jsonError(error.message, 500);
  }

  if (delete_chapters?.length) {
    await supabase.from("chapters").delete().eq("product_id", product.id).in("id", delete_chapters);
    // Close the numbering gaps, lowest first so the unique constraint never collides
    const { data: remaining } = await supabase.from("chapters").select("id, chapter_number").eq("product_id", product.id).order("chapter_number");
    for (const [i, ch] of (remaining ?? []).entries()) {
      if (ch.chapter_number !== i + 1) await supabase.from("chapters").update({ chapter_number: i + 1 }).eq("id", ch.id);
    }
  }

  for (const ch of chapters ?? []) {
    const patch: Record<string, string> = {};
    if (ch.title !== undefined) patch.title = ch.title;
    if (ch.content !== undefined) patch.content = ch.content;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from("chapters").update(patch).eq("id", ch.id).eq("product_id", product.id);
      if (error) return jsonError(error.message, 500);
    }
  }

  if (new_chapters?.length) {
    const { data: last } = await supabase
      .from("chapters")
      .select("chapter_number")
      .eq("product_id", product.id)
      .order("chapter_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    let n = last?.chapter_number ?? 0;
    const rows = new_chapters.map((c) => ({ product_id: product.id, chapter_number: ++n, title: c.title, content: c.content }));
    const { error } = await supabase.from("chapters").insert(rows);
    if (error) return jsonError(error.message, 500);
  }

  const [{ data: fresh }, { data: freshChapters }] = await Promise.all([
    supabase.from("products").select("*").eq("id", product.id).single(),
    supabase.from("chapters").select("*").eq("product_id", product.id).order("chapter_number"),
  ]);
  return NextResponse.json({ product: fresh, chapters: freshChapters });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser({ requirePaid: false });
  if (!current) return unauthorized();
  const product = await getOwnedProduct(params.id);
  if (!product) return notFound();
  if (product.pdf_path) await createAdminClient().storage.from("ebooks").remove([product.pdf_path]);
  const { error } = await createClient().from("products").delete().eq("id", product.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
