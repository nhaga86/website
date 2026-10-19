"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Copy,
  Eye,
  ImageIcon,
  Loader2,
  Palette,
  PenLine,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BuilderHeader } from "@/components/builder/stepper";
import { EbookPreview } from "@/components/builder/ebook-preview";
import { RichTextEditor } from "@/components/builder/rich-text-editor";
import { FontLoader } from "@/components/product/font-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import { FONT_PAIRINGS } from "@/lib/fonts";
import { wordCount } from "@/lib/html";
import { cn, isHexColor } from "@/lib/utils";
import type { BrandColors, Chapter, Product } from "@/lib/types";

const COLOR_FIELDS: { key: keyof BrandColors; label: string; hint: string }[] = [
  { key: "primary", label: "Primary", hint: "Buttons, accents" },
  { key: "secondary", label: "Secondary", hint: "Headings, dark areas" },
  { key: "accent", label: "Accent", hint: "Light backgrounds" },
];

export function EditorClient({
  product,
  chapters: initialChapters,
  defaultAuthor,
  aiCovers,
}: {
  product: Product;
  chapters: Chapter[];
  defaultAuthor: string;
  aiCovers: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [subtitle, setSubtitle] = useState(product.subtitle || "");
  const [description, setDescription] = useState(product.description || "");
  const [colors, setColors] = useState<BrandColors>(product.brand_colors);
  const [font, setFont] = useState(product.font);
  const [coverUrl, setCoverUrl] = useState(product.cover_url);
  const [coverOverlay, setCoverOverlay] = useState(product.cover_overlay);
  const [coverPrompt, setCoverPrompt] = useState(product.cover_prompt || "");
  const [suggestions, setSuggestions] = useState<BrandColors[]>(product.color_suggestions || []);
  const [chapters, setChapters] = useState(initialChapters);
  const [dirtyChapters, setDirtyChapters] = useState<Set<string>>(new Set());
  const [productDirty, setProductDirty] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [tab, setTab] = useState("details");
  const fileRef = useRef<HTMLInputElement>(null);
  const author = product.sales_page?.author_name || product.brand_name || defaultAuthor;
  const active = chapters.find((c) => c.id === activeId) || null;
  const dirty = productDirty || dirtyChapters.size > 0;

  const markProduct = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setProductDirty(true);
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (activeId) document.getElementById(`preview-chapter-${activeId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  const totalWords = useMemo(() => chapters.reduce((n, c) => n + wordCount(c.content), 0), [chapters]);

  function updateChapter(id: string, patch: Partial<Chapter>) {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setDirtyChapters((prev) => new Set(prev).add(id));
  }

  async function save(next?: string) {
    setBusy("save");
    try {
      await api(`/api/products/${product.id}`, {
        method: "PATCH",
        json: {
          product: { title, subtitle, description, brand_colors: colors, font, cover_overlay: coverOverlay, cover_prompt: coverPrompt },
          chapters: chapters.filter((c) => dirtyChapters.has(c.id)).map((c) => ({ id: c.id, title: c.title, content: c.content })),
        },
      });
      setDirtyChapters(new Set());
      setProductDirty(false);
      if (next) router.push(next);
      else toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateCover() {
    setBusy("cover");
    try {
      const { url } = await api<{ url: string }>(`/api/products/${product.id}/cover`, { method: "POST", json: { prompt: coverPrompt } });
      setCoverUrl(url);
      setCoverOverlay(true);
      toast.success("New cover ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cover generation failed");
    } finally {
      setBusy(null);
    }
  }

  async function uploadCover(file: File) {
    setBusy("upload");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", product.id);
      form.append("kind", "cover");
      const { url } = await api<{ url: string }>("/api/upload", { method: "POST", body: form });
      setCoverUrl(url);
      setCoverOverlay(false);
      toast.success("Cover uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeCover() {
    setCoverUrl(null);
    await api(`/api/products/${product.id}`, { method: "PATCH", json: { product: { cover_url: null } } }).catch(() => null);
  }

  async function morePalettes() {
    setBusy("palettes");
    try {
      const { palettes } = await api<{ palettes: BrandColors[] }>(`/api/products/${product.id}/palettes`, { method: "POST" });
      setSuggestions(palettes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function rewriteChapter(c: Chapter) {
    if (dirtyChapters.has(c.id) && !confirm("Replace your edits to this chapter with a fresh AI draft?")) return;
    setBusy(`rewrite-${c.id}`);
    try {
      // Save a changed title first so the AI writes to it
      if (dirtyChapters.has(c.id)) await api(`/api/products/${product.id}`, { method: "PATCH", json: { chapters: [{ id: c.id, title: c.title }] } });
      const res = await api<{ content: string }>(`/api/products/${product.id}/chapters/${c.chapter_number}/generate`, { method: "POST" });
      setChapters((prev) => prev.map((x) => (x.id === c.id ? { ...x, content: res.content } : x)));
      setDirtyChapters((prev) => {
        const n = new Set(prev);
        n.delete(c.id);
        return n;
      });
      setEditorVersion((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setBusy(null);
    }
  }

  async function addChapter() {
    setBusy("add");
    try {
      const res = await api<{ chapters: Chapter[] }>(`/api/products/${product.id}`, {
        method: "PATCH",
        json: {
          chapters: chapters.filter((c) => dirtyChapters.has(c.id)).map((c) => ({ id: c.id, title: c.title, content: c.content })),
          new_chapters: [{ title: "New chapter", content: "" }],
        },
      });
      setChapters(res.chapters);
      setDirtyChapters(new Set());
      setActiveId(res.chapters[res.chapters.length - 1]?.id ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteChapter(c: Chapter) {
    if (!confirm(`Delete chapter ${c.chapter_number}, "${c.title}"?`)) return;
    setBusy("delete");
    try {
      const res = await api<{ chapters: Chapter[] }>(`/api/products/${product.id}`, {
        method: "PATCH",
        json: {
          chapters: chapters.filter((x) => dirtyChapters.has(x.id) && x.id !== c.id).map((x) => ({ id: x.id, title: x.title, content: x.content })),
          delete_chapters: [c.id],
        },
      });
      setChapters(res.chapters);
      setDirtyChapters(new Set());
      setActiveId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <FontLoader fontId={font} />
      <BuilderHeader
        step={3}
        productId={product.id}
        title={title}
        actions={
          <>
            <Button variant="outline" onClick={() => save()} disabled={!!busy || !dirty}>
              {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Save" : "Saved"}
            </Button>
            <Button onClick={() => save(`/dashboard/products/${product.id}/sales-page`)} disabled={!!busy}>
              Save & Build Sales Page <ArrowRight />
            </Button>
          </>
        }
      />

      <div className="flex gap-2 border-b px-4 py-2 lg:hidden">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium", mobileView === v ? "bg-neutral-950 text-white" : "bg-muted")}
          >
            {v === "edit" ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {v === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_480px]">
        {/* Left: live preview */}
        <div className={cn("bg-neutral-100 px-4 py-8 lg:block lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:px-10", mobileView === "edit" && "hidden")}>
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview. {chapters.length} chapters, {totalWords.toLocaleString()} words
          </p>
          <EbookPreview
            title={title}
            subtitle={subtitle}
            author={author}
            coverUrl={coverUrl}
            coverOverlay={coverOverlay}
            colors={colors}
            fontId={font}
            chapters={chapters}
            activeChapterId={activeId}
          />
        </div>

        {/* Right: editors */}
        <div className={cn("border-l bg-white lg:block lg:h-[calc(100vh-65px)] lg:overflow-y-auto", mobileView === "preview" && "hidden")}>
          <Tabs value={tab} onValueChange={setTab} className="p-5">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details"><Type className="h-3.5 w-3.5" /> Text</TabsTrigger>
              <TabsTrigger value="brand"><Palette className="h-3.5 w-3.5" /> Brand</TabsTrigger>
              <TabsTrigger value="cover"><ImageIcon className="h-3.5 w-3.5" /> Cover</TabsTrigger>
              <TabsTrigger value="chapters"><BookOpen className="h-3.5 w-3.5" /> Chapters</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-5">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => markProduct(setTitle)(e.target.value)} />
                {product.title_options.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.title_options.filter((t) => t !== title).map((t) => (
                      <button key={t} onClick={() => markProduct(setTitle)(t)} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={subtitle} onChange={(e) => markProduct(setSubtitle)(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={10} value={description} onChange={(e) => markProduct(setDescription)(e.target.value)} />
                <p className="text-xs text-muted-foreground">Shown on your sales page.</p>
              </div>
            </TabsContent>

            <TabsContent value="brand" className="space-y-6">
              <div className="space-y-3">
                <Label>Brand colors</Label>
                {COLOR_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colors[f.key]}
                      onChange={(e) => markProduct(setColors)({ ...colors, [f.key]: e.target.value.toUpperCase() })}
                      className="h-10 w-12 cursor-pointer rounded-lg border bg-white p-1"
                      aria-label={f.label}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.hint}</p>
                    </div>
                    <Input
                      className="w-28 font-mono text-xs uppercase"
                      defaultValue={colors[f.key]}
                      key={colors[f.key]}
                      onBlur={(e) => {
                        const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                        if (isHexColor(v)) markProduct(setColors)({ ...colors, [f.key]: v.toUpperCase() });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI suggestions</Label>
                  <Button size="sm" variant="ghost" onClick={morePalettes} disabled={busy === "palettes"}>
                    {busy === "palettes" ? <Loader2 className="animate-spin" /> : <Sparkles />} More ideas
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((p, i) => (
                    <button key={i} onClick={() => markProduct(setColors)(p)} className="flex h-10 overflow-hidden rounded-lg ring-1 ring-black/10 transition-transform hover:scale-[1.03]">
                      {[p.primary, p.secondary, p.accent].map((c, j) => (
                        <span key={j} className="flex-1" style={{ background: c }} />
                      ))}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Font pairing</Label>
                {tab === "brand" && FONT_PAIRINGS.map((f) => <FontLoader key={f.id} fontId={f.id} />)}
                <div className="grid gap-2">
                  {FONT_PAIRINGS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => markProduct(setFont)(f.id)}
                      className={cn("rounded-xl border-2 px-4 py-3 text-left transition-colors", font === f.id ? "border-brand-600 bg-brand-50" : "border-transparent bg-muted/50 hover:bg-muted")}
                    >
                      <p className="text-lg font-bold" style={{ fontFamily: `'${f.heading}', serif` }}>{f.heading}</p>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: `'${f.body}', sans-serif` }}>Paired with {f.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover" className="space-y-6">
              {!coverUrl && (
                <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  No image yet, so the preview shows a branded cover built from your title and colors. It works as a finished cover.
                </p>
              )}
              <div className="space-y-2">
                <Label>Cover prompt</Label>
                <Textarea rows={6} value={coverPrompt} onChange={(e) => markProduct(setCoverPrompt)(e.target.value)} />
                {aiCovers ? (
                  <Button className="w-full" onClick={generateCover} disabled={!!busy}>
                    {busy === "cover" ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    {busy === "cover" ? "Painting your cover (up to a minute)..." : coverUrl ? "Generate a new cover" : "Generate cover"}
                  </Button>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Paste this prompt into a free image tool, then upload the result below.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(coverPrompt);
                        toast.success("Prompt copied");
                      }}
                    >
                      <Copy /> Copy
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={!!busy}>
                  {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />} Upload your own (PNG or JPG, 2:3)
                </Button>
              </div>
              {coverUrl && (
                <div className="space-y-4 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show title on cover</p>
                      <p className="text-xs text-muted-foreground">Turn off if your image already has text.</p>
                    </div>
                    <Switch checked={coverOverlay} onCheckedChange={markProduct(setCoverOverlay)} />
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={removeCover}>
                    <X /> Remove image
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chapters" className="space-y-4">
              {active ? (
                <div className="space-y-4">
                  <button onClick={() => setActiveId(null)} className="text-sm text-muted-foreground hover:text-foreground">
                    &larr; All chapters
                  </button>
                  <div className="space-y-2">
                    <Label>Chapter {active.chapter_number} title</Label>
                    <Input value={active.title} onChange={(e) => updateChapter(active.id, { title: e.target.value })} />
                  </div>
                  <RichTextEditor key={`${active.id}-${editorVersion}`} value={active.content} onChange={(html) => updateChapter(active.id, { content: html })} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{wordCount(active.content)} words</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteChapter(active)} disabled={!!busy}>
                        <Trash2 /> Delete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rewriteChapter(active)} disabled={!!busy}>
                        {busy === `rewrite-${active.id}` ? <Loader2 className="animate-spin" /> : <Sparkles />} Rewrite with AI
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Click a chapter to edit it.</p>
                  <ol className="divide-y rounded-xl border">
                    {chapters.map((c) => (
                      <li key={c.id}>
                        <button onClick={() => setActiveId(c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold" style={{ background: colors.accent, color: colors.primary }}>
                            {c.chapter_number}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
                          {dirtyChapters.has(c.id) && <span className="h-2 w-2 rounded-full bg-amber-400" title="Unsaved" />}
                          <span className="text-xs text-muted-foreground">{wordCount(c.content)}w</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <Button variant="outline" className="w-full" onClick={addChapter} disabled={!!busy}>
                    {busy === "add" ? <Loader2 className="animate-spin" /> : <Plus />} Add chapter
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

