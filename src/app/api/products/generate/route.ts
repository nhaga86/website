import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { jsonError, unauthorized } from "@/lib/api";
import { generateProductPlan } from "@/lib/openai";
import { uniqueSlug } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { TONES } from "@/lib/types";

export const maxDuration = 60;

const schema = z.object({
  idea: z.string().trim().min(3).max(1000),
  audience: z.string().trim().min(2).max(300),
  tone: z.enum(TONES),
});

/** Step 2a: titles, copy, outline, branding. Chapters are written one by one afterwards. */
export async function POST(request: Request) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Describe your product, audience and tone.");
  const input = parsed.data;

  let plan;
  try {
    plan = await generateProductPlan(input);
  } catch (e) {
    console.error(e);
    return jsonError("The AI could not plan this product. Try again in a moment.", 502);
  }

  const supabase = createClient();
  const title = plan.title_options[0] || input.idea.slice(0, 60);
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      user_id: current.profile.id,
      slug: await uniqueSlug(title),
      title,
      subtitle: plan.subtitle,
      description: plan.description,
      brand_colors: plan.colors,
      color_suggestions: plan.color_suggestions ?? [],
      font: plan.font_pairing_id,
      cover_prompt: plan.cover_prompt,
      idea: input.idea,
      audience: input.audience,
      tone: input.tone,
      title_options: plan.title_options,
      brand_names: plan.brand_names,
      brand_name: plan.brand_names[0] ?? null,
      sales_page: { author_name: current.profile.full_name || "" },
    })
    .select("id")
    .single();
  if (error || !product) return jsonError(error?.message || "Could not save product", 500);

  const chapters = plan.chapters.map((c, i) => ({
    product_id: product.id,
    chapter_number: i + 1,
    title: c.title,
    summary: c.summary,
    content: "",
  }));
  const { error: chError } = await supabase.from("chapters").insert(chapters);
  if (chError) return jsonError(chError.message, 500);

  return NextResponse.json({
    id: product.id,
    chapters: chapters.map((c) => ({ chapter_number: c.chapter_number, title: c.title })),
  });
}
