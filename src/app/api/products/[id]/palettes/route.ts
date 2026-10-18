import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { suggestPalettes } from "@/lib/ai";
import { getOwnedProduct } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { isHexColor } from "@/lib/utils";

export const maxDuration = 30;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const product = await getOwnedProduct(params.id);
  if (!product) return notFound();
  try {
    const palettes = (await suggestPalettes(product)).filter(
      (p) => isHexColor(p.primary) && isHexColor(p.secondary) && isHexColor(p.accent)
    );
    await createClient().from("products").update({ color_suggestions: palettes }).eq("id", product.id);
    return NextResponse.json({ palettes });
  } catch (e) {
    console.error(e);
    return jsonError("Could not get color ideas", 502);
  }
}
