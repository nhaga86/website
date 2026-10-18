import "server-only";
import OpenAI from "openai";
import { FONT_PAIRINGS } from "@/lib/fonts";
import type { BrandColors, FaqItem, Testimonial } from "@/lib/types";

let client: OpenAI | null = null;
export function openai() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const TEXT_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

const STYLE_RULES = `Writing rules:
- Write like a sharp human expert, never like a content generator.
- Be direct. No hedge words (quite, rather, arguably, basically, essentially).
- Vary sentence length. Mix short punchy lines with longer ones.
- Never use em dashes. Use commas and full stops.
- Avoid filler words: delve, tapestry, testament, journey, unlock, elevate, game-changer, seamless, robust, comprehensive, nuanced, paradigm.
- Give concrete, specific, useful detail. Every paragraph must teach or move the reader.`;

async function jsonCompletion<T>(system: string, user: string, temperature = 0.8): Promise<T> {
  const res = await openai().chat.completions.create({
    model: TEXT_MODEL,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${system}\n\n${STYLE_RULES}\n\nRespond with valid JSON only.` },
      { role: "user", content: user },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response");
  return JSON.parse(text) as T;
}

export interface GeneratedProduct {
  title_options: string[];
  subtitle: string;
  description: string;
  chapters: { title: string; summary: string }[];
  brand_names: string[];
  colors: BrandColors;
  color_suggestions: BrandColors[];
  font_pairing_id: string;
  cover_prompt: string;
}

export async function generateProductPlan(input: { idea: string; audience: string; tone: string }) {
  const fonts = FONT_PAIRINGS.map((f) => `${f.id} (${f.label})`).join(", ");
  const data = await jsonCompletion<GeneratedProduct>(
    "You are a bestselling digital product strategist and ebook author. You design ebooks that sell.",
    `Create a complete digital product (an ebook) plan.

Product idea: ${input.idea}
Target audience: ${input.audience}
Tone of voice: ${input.tone}

Return JSON with exactly these keys:
{
  "title_options": [3 distinct, compelling ebook titles, max 8 words each],
  "subtitle": "one subtitle that states the concrete outcome",
  "description": "about 150 words of persuasive sales copy for the product page, written to the target audience, plain text, 2 to 3 short paragraphs separated by \\n\\n",
  "chapters": [exactly 8 objects { "title": "chapter title", "summary": "one sentence on what the chapter teaches" }],
  "brand_names": [5 short brandable names for the creator's brand],
  "colors": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB" },
  "color_suggestions": [3 alternative palettes, each { "primary", "secondary", "accent" } as #RRGGBB],
  "font_pairing_id": "one id from this list that fits the tone: ${fonts}",
  "cover_prompt": "a detailed prompt for an AI image model to create ebook cover ARTWORK only. Describe style, subject, composition, lighting and the palette. Portrait orientation. Leave clear space in the top third for a title. No text, no letters, no words in the image."
}

Palette rules: primary is the main brand color and must be strong enough for white button text. secondary is a dark color for headings. accent is a very light tint for backgrounds.`
  );

  if (!Array.isArray(data.chapters) || data.chapters.length === 0) throw new Error("AI did not return chapters");
  data.chapters = data.chapters.slice(0, 8);
  data.title_options = (data.title_options || []).slice(0, 3);
  data.brand_names = (data.brand_names || []).slice(0, 5);
  if (!FONT_PAIRINGS.some((f) => f.id === data.font_pairing_id)) data.font_pairing_id = FONT_PAIRINGS[0].id;
  return data;
}

export async function generateChapterContent(input: {
  productTitle: string;
  subtitle?: string | null;
  audience?: string | null;
  tone?: string | null;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary?: string | null;
  outline: string[];
}) {
  const res = await openai().chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content: `You are an expert author writing a chapter of a paid ebook. Output clean HTML only using <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. No <html>, <body>, markdown, or code fences. Do not repeat the chapter title as a heading.\n\n${STYLE_RULES}`,
      },
      {
        role: "user",
        content: `Ebook: "${input.productTitle}"${input.subtitle ? ` (${input.subtitle})` : ""}
Audience: ${input.audience || "general readers"}
Tone: ${input.tone || "Friendly"}
Full outline:
${input.outline.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Write chapter ${input.chapterNumber}: "${input.chapterTitle}".
${input.chapterSummary ? `This chapter covers: ${input.chapterSummary}` : ""}

Length: about 400 words. Include at least one subheading (<h3>), one list of practical steps or points, and end with a short action step the reader can take today.`,
      },
    ],
  });
  let html = res.choices[0]?.message?.content?.trim() || "";
  html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").replace(/\s*\u2014\s*/g, ", ");
  return html;
}

export interface GeneratedSalesPage {
  hero_headline: string;
  hero_subheadline: string;
  cta_text: string;
  whats_inside_title: string;
  benefits: string[];
  author_bio: string;
  testimonials: Testimonial[];
  faq: FaqItem[];
  guarantee: string;
}

export async function generateSalesPageCopy(input: {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  audience?: string | null;
  tone?: string | null;
  chapters: string[];
  authorName?: string | null;
}) {
  return jsonCompletion<GeneratedSalesPage>(
    "You are a direct response copywriter who writes high converting sales pages for ebooks.",
    `Write sales page copy for this ebook.

Title: ${input.title}
Subtitle: ${input.subtitle || ""}
Description: ${input.description || ""}
Audience: ${input.audience || ""}
Tone: ${input.tone || "Friendly"}
Chapters: ${input.chapters.join(" | ")}
Author name: ${input.authorName || "the author"}

Return JSON:
{
  "hero_headline": "max 12 words, outcome focused",
  "hero_subheadline": "one or two sentences that make the reader want to keep reading",
  "cta_text": "button text, max 5 words",
  "whats_inside_title": "heading for the chapter list section",
  "benefits": [5 short benefit bullets],
  "author_bio": "60 to 90 word first person bio for the author that builds credibility for this topic",
  "testimonials": [3 placeholder testimonials { "name": "first name and last initial", "role": "short descriptor", "quote": "1 to 2 sentences, specific" }],
  "faq": [5 objects { "question", "answer" } covering format, who it is for, delivery, refunds, time needed],
  "guarantee": "one sentence money back guarantee"
}`
  );
}

export async function suggestPalettes(input: { title: string; tone?: string | null; audience?: string | null }) {
  const data = await jsonCompletion<{ palettes: BrandColors[] }>(
    "You are a brand designer.",
    `Suggest 4 distinct brand color palettes for an ebook titled "${input.title}" for ${input.audience || "a general audience"} with a ${input.tone || "friendly"} tone.
Return JSON { "palettes": [ { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB" } ] }.
primary must carry white button text, secondary is a dark heading color, accent is a very light background tint.`
  );
  return data.palettes || [];
}

/** Returns raw PNG bytes for the cover artwork. */
export async function generateCoverImage(prompt: string) {
  const isDalle = IMAGE_MODEL.startsWith("dall-e");
  const res = await openai().images.generate({
    model: IMAGE_MODEL,
    prompt: `${prompt}\n\nBook cover artwork, portrait. Absolutely no text, letters or typography in the image.`,
    n: 1,
    size: isDalle ? "1024x1792" : "1024x1536",
    ...(isDalle ? { response_format: "b64_json" as const } : {}),
  });
  const b64 = res.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");
  const url = res.data?.[0]?.url;
  if (url) return Buffer.from(await (await fetch(url)).arrayBuffer());
  throw new Error("Image model returned no image");
}
