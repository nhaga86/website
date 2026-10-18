"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BuilderHeader } from "@/components/builder/stepper";
import { FontLoader } from "@/components/product/font-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import { getFontPairing } from "@/lib/fonts";
import { wordCount } from "@/lib/html";
import { cn } from "@/lib/utils";
import type { BrandColors, Chapter, Product } from "@/lib/types";

export function ReviewClient({ product, chapters: initialChapters }: { product: Product; chapters: Chapter[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [subtitle, setSubtitle] = useState(product.subtitle || "");
  const [description, setDescription] = useState(product.description || "");
  const [brandName, setBrandName] = useState(product.brand_name || "");
  const [colors, setColors] = useState<BrandColors>(product.brand_colors);
  const [coverPrompt, setCoverPrompt] = useState(product.cover_prompt || "");
  const [chapters, setChapters] = useState(initialChapters);
  const [writing, setWriting] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const fonts = getFontPairing(product.font);
  const palettes = [product.brand_colors, ...(product.color_suggestions || [])];
  const missing = chapters.filter((c) => !c.content.trim());

  async function writeChapter(n: number) {
    setWriting((w) => [...w, n]);
    try {
      const res = await api<{ id: string; content: string }>(`/api/products/${product.id}/chapters/${n}/generate`, { method: "POST" });
      setChapters((prev) => prev.map((c) => (c.id === res.id ? { ...c, content: res.content } : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setWriting((w) => w.filter((x) => x !== n));
    }
  }

  async function continueNext() {
    setSaving(true);
    try {
      await api(`/api/products/${product.id}`, {
        method: "PATCH",
        json: { product: { title, subtitle, description, brand_name: brandName || null, brand_colors: colors, cover_prompt: coverPrompt } },
      });
      router.push(`/dashboard/products/${product.id}/edit`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <div>
      <FontLoader fontId={product.font} />
      <BuilderHeader
        step={2}
        productId={product.id}
        title={title}
        actions={
          <Button onClick={continueNext} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Continue to branding <ArrowRight />
          </Button>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pick your title</CardTitle>
              <CardDescription>Three options from the AI. Click one, or write your own.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.title_options.map((t) => (
                <button
                  key={t}
                  onClick={() => setTitle(t)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                    title === t ? "border-brand-600 bg-brand-50" : "border-transparent bg-muted/60 hover:bg-muted"
                  )}
                >
                  <span className="text-lg font-semibold" style={{ fontFamily: `'${fonts.heading}', serif` }}>{t}</span>
                  {title === t && <Check className="h-5 w-5 shrink-0 text-brand-600" />}
                </button>
              ))}
              <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Custom title" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subtitle and sales description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Product description</Label>
                  <span className="text-xs text-muted-foreground">{description.split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <Textarea rows={8} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Ebook outline</CardTitle>
                <CardDescription>{chapters.length} chapters, {chapters.reduce((n, c) => n + wordCount(c.content), 0).toLocaleString()} words written</CardDescription>
              </div>
              {missing.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => missing.forEach((c) => writeChapter(c.chapter_number))}>
                  <RefreshCw /> Write {missing.length} missing
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ol className="divide-y rounded-xl border">
                {chapters.map((c) => (
                  <li key={c.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">{c.chapter_number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.title}</p>
                      {c.summary && <p className="truncate text-xs text-muted-foreground">{c.summary}</p>}
                    </div>
                    {writing.includes(c.chapter_number) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                    ) : c.content.trim() ? (
                      <span className="text-xs text-muted-foreground">{wordCount(c.content)} words</span>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => writeChapter(c.chapter_number)}>Write</Button>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {product.brand_names.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrandName(b)}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", brandName === b ? "border-brand-600 bg-brand-600 text-white" : "hover:bg-muted")}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your brand" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color palette</CardTitle>
              <CardDescription>Fine tune with color pickers in the next step.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {palettes.map((p, i) => {
                const selected = p.primary === colors.primary && p.secondary === colors.secondary && p.accent === colors.accent;
                return (
                  <button
                    key={i}
                    onClick={() => setColors(p)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-2", selected ? "border-brand-600" : "border-transparent hover:bg-muted")}
                  >
                    <div className="flex h-10 flex-1 overflow-hidden rounded-lg">
                      {[p.primary, p.secondary, p.accent].map((c) => (
                        <span key={c} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="w-16 text-left text-xs text-muted-foreground">{i === 0 ? "AI pick" : `Option ${i}`}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Font pairing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" style={{ fontFamily: `'${fonts.heading}', serif` }}>{fonts.heading}</p>
              <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: `'${fonts.body}', sans-serif` }}>
                Body text set in {fonts.body}. Change it in the editor.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover design prompt</CardTitle>
              <CardDescription>Used to generate your cover art in the next step.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea rows={6} value={coverPrompt} onChange={(e) => setCoverPrompt(e.target.value)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
