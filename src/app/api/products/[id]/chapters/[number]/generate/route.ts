import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { generateChapterContent } from "@/lib/ai";
import { getOwnedProductWithChapters } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/** Writes (or rewrites) one chapter, about 400 words. */
export async function POST(_req: Request, { params }: { params: { id: string; number: string } }) {
  const current = await getApiUser();
  if (!current) return unauthorized();
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) return notFound();
  const n = Number(params.number);
  const chapter = data.chapters.find((c) => c.chapter_number === n);
  if (!chapter) return notFound();

  let content: string;
  try {
    content = await generateChapterContent({
      productTitle: data.product.title,
      subtitle: data.product.subtitle,
      audience: data.product.audience,
      tone: data.product.tone,
      chapterNumber: n,
      chapterTitle: chapter.title,
      chapterSummary: chapter.summary,
      outline: data.chapters.map((c) => c.title),
    });
  } catch (e) {
    console.error(e);
    return jsonError("The AI could not write this chapter. Try again.", 502);
  }

  const { error } = await createClient().from("chapters").update({ content }).eq("id", chapter.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ id: chapter.id, content });
}
