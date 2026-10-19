import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { coverGenerationEnabled, generateCoverImage } from "@/lib/ai";
import { getOwnedProduct } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

/** Generates cover artwork from the prompt and stores it in the public covers bucket. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  if (!coverGenerationEnabled()) return jsonError("AI covers are turned off. Upload your own cover instead.");
  const product = await getOwnedProduct(params.id);
  if (!product) return notFound();
  const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: string };
  const finalPrompt = (prompt || product.cover_prompt || `Ebook cover artwork for "${product.title}"`).slice(0, 3800);

  let bytes: Buffer;
  try {
    bytes = await generateCoverImage(finalPrompt);
  } catch (e) {
    console.error(e);
    return jsonError(e instanceof Error ? e.message : "Image generation failed", 502);
  }

  const path = `${current.profile.id}/${product.id}/cover-${Date.now()}.png`;
  const storage = createAdminClient().storage.from("covers");
  const { error } = await storage.upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) return jsonError(error.message, 500);
  const url = storage.getPublicUrl(path).data.publicUrl;

  await createClient().from("products").update({ cover_url: url, cover_prompt: finalPrompt, cover_overlay: true }).eq("id", product.id);
  return NextResponse.json({ url });
}
