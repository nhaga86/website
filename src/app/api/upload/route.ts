import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { getOwnedProduct } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg" };
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads a custom cover or author photo (PNG or JPEG, up to 8 MB). */
export async function POST(request: Request) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const form = await request.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") || "");
  const kind = String(form.get("kind") || "cover");
  if (!(file instanceof File)) return jsonError("No file");
  if (!TYPES[file.type]) return jsonError("Use a PNG or JPG image");
  if (file.size > MAX_BYTES) return jsonError("Images must be under 8 MB");
  const product = await getOwnedProduct(productId);
  if (!product) return notFound();

  const path = `${current.profile.id}/${product.id}/${kind}-${Date.now()}.${TYPES[file.type]}`;
  const storage = createAdminClient().storage.from("covers");
  const { error } = await storage.upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
  if (error) return jsonError(error.message, 500);
  const url = storage.getPublicUrl(path).data.publicUrl;

  const supabase = createClient();
  if (kind === "cover") {
    // Uploaded covers usually include their own title, so the overlay starts off
    await supabase.from("products").update({ cover_url: url, cover_overlay: false }).eq("id", product.id);
  } else if (kind === "author") {
    await supabase
      .from("products")
      .update({ sales_page: { ...product.sales_page, author_photo_url: url } })
      .eq("id", product.id);
  }
  return NextResponse.json({ url });
}
