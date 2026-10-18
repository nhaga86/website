"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Monitor, Plus, Save, Smartphone, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { BuilderHeader } from "@/components/builder/stepper";
import { FontLoader } from "@/components/product/font-loader";
import { SalesPage, TEMPLATES, toSalesPageData } from "@/components/sales-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import { cn, slugify } from "@/lib/utils";
import type { Chapter, FaqItem, Product, SalesPageContent, SalesTemplateId, Testimonial } from "@/lib/types";

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <details open className="group border-b px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-2">
          {title} {badge && <Badge variant="warning">{badge}</Badge>}
        </span>
        <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-4 space-y-3">{children}</div>
    </details>
  );
}

export function SalesPageBuilder({ product, chapters, appUrl }: { product: Product; chapters: Chapter[]; appUrl: string }) {
  const router = useRouter();
  const [template, setTemplate] = useState<SalesTemplateId>(product.sales_page_template);
  const [content, setContent] = useState<SalesPageContent>(product.sales_page || {});
  const [slug, setSlug] = useState(product.slug);
  const [slugState, setSlugState] = useState<"ok" | "taken" | "checking">("ok");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [busy, setBusy] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const autoRan = useRef(false);

  const set = <K extends keyof SalesPageContent>(key: K, value: SalesPageContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
    setDirty(true);
  };

  async function generate() {
    setBusy("ai");
    try {
      const { sales_page } = await api<{ sales_page: SalesPageContent }>(`/api/products/${product.id}/sales-page`, { method: "POST" });
      setContent(sales_page);
      toast.success("Sales copy written");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  // First visit: fill the page automatically
  useEffect(() => {
    if (!autoRan.current && !product.sales_page?.hero_headline) {
      autoRan.current = true;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (slug === product.slug) return setSlugState("ok");
    setSlugState("checking");
    const t = setTimeout(async () => {
      const res = await api<{ available: boolean }>(`/api/products/slug-check?slug=${encodeURIComponent(slug)}&id=${product.id}`).catch(() => ({ available: false }));
      setSlugState(res.available ? "ok" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [slug, product.slug, product.id]);

  async function save(next?: string) {
    if (slugState === "taken") return toast.error("That link is taken. Pick another.");
    setBusy("save");
    try {
      await api(`/api/products/${product.id}`, {
        method: "PATCH",
        json: { product: { sales_page_template: template, sales_page: content, slug } },
      });
      setDirty(false);
      if (next) router.push(next);
      else {
        toast.success("Saved");
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function uploadPhoto(file: File) {
    setBusy("photo");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", product.id);
      form.append("kind", "author");
      const { url } = await api<{ url: string }>("/api/upload", { method: "POST", body: form });
      set("author_photo_url", url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const benefits = content.benefits || [];
  const updateList = <T,>(key: "testimonials" | "faq" | "benefits", list: T[], i: number, patch: Partial<T> | T) => {
    const next = [...list];
    next[i] = typeof patch === "object" && patch !== null ? { ...(list[i] as object), ...(patch as object) } as T : (patch as T);
    set(key, next as never);
  };

  const data = toSalesPageData({ ...product, sales_page: content }, chapters);

  return (
    <div className="flex min-h-screen flex-col">
      <FontLoader fontId={product.font} />
      <BuilderHeader
        step={4}
        productId={product.id}
        title={product.title}
        actions={
          <>
            <Button variant="outline" onClick={() => save()} disabled={!!busy}>
              {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Save" : "Saved"}
            </Button>
            <Button onClick={() => save(`/dashboard/products/${product.id}/publish`)} disabled={!!busy}>
              Continue to publish <ArrowRight />
            </Button>
          </>
        }
      />

      <div className="grid flex-1 lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="border-r bg-white lg:h-[calc(100vh-65px)] lg:overflow-y-auto">
          <div className="border-b p-5">
            <Label>Template</Label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplate(t.id);
                    setDirty(true);
                  }}
                  title={t.description}
                  className={cn("relative rounded-xl border-2 p-2 text-left transition-colors", template === t.id ? "border-brand-600 bg-brand-50" : "border-border hover:bg-muted")}
                >
                  <TemplateThumb id={t.id} color={product.brand_colors.primary} dark={product.brand_colors.secondary} />
                  <p className="mt-2 text-xs font-semibold">{t.name}</p>
                  {template === t.id && <Check className="absolute right-2 top-2 h-4 w-4 text-brand-600" />}
                </button>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={generate} disabled={!!busy}>
              {busy === "ai" ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy === "ai" ? "Writing your sales page..." : "Rewrite all copy with AI"}
            </Button>
          </div>

          <Section title="Page link">
            <div className="flex items-center overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-ring">
              <span className="whitespace-nowrap bg-muted px-3 py-2.5 text-xs text-muted-foreground">{appUrl.replace(/^https?:\/\//, "")}/p/</span>
              <input
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value) || e.target.value.toLowerCase());
                  setDirty(true);
                }}
              />
              <span className="px-3">
                {slugState === "checking" ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : slugState === "ok" ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-red-600" />}
              </span>
            </div>
            {slugState === "taken" && <p className="text-xs text-red-600">Taken. Try another.</p>}
          </Section>

          <Section title="Hero">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Textarea rows={2} value={content.hero_headline || ""} onChange={(e) => set("hero_headline", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Textarea rows={3} value={content.hero_subheadline || ""} onChange={(e) => set("hero_subheadline", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Checkout button text</Label>
              <Input value={content.cta_text || ""} onChange={(e) => set("cta_text", e.target.value)} placeholder="Get instant access" />
            </div>
          </Section>

          <Section title="Benefits">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-2">
                <Input value={b} onChange={(e) => updateList("benefits", benefits, i, e.target.value)} />
                <Button size="icon" variant="ghost" onClick={() => set("benefits", benefits.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => set("benefits", [...benefits, ""])}><Plus /> Add benefit</Button>
          </Section>

          <Section title="What's inside">
            <div className="space-y-2">
              <Label>Section heading</Label>
              <Input value={content.whats_inside_title || ""} onChange={(e) => set("whats_inside_title", e.target.value)} placeholder="What's inside" />
            </div>
            <ol className="space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
              {chapters.map((c) => (
                <li key={c.id} className="truncate">{c.chapter_number}. {c.title}</li>
              ))}
            </ol>
            <Link href={`/dashboard/products/${product.id}/edit`} className="text-xs font-medium text-brand-700 hover:underline">Edit chapters in step 3</Link>
          </Section>

          <Section title="About the author">
            <div className="flex items-center gap-3">
              {content.author_photo_url ? (
                <img src={content.author_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">?</div>
              )}
              <input ref={photoRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              <Button size="sm" variant="outline" onClick={() => photoRef.current?.click()} disabled={busy === "photo"}>
                {busy === "photo" ? <Loader2 className="animate-spin" /> : <Upload />} Photo
              </Button>
              {content.author_photo_url && (
                <Button size="sm" variant="ghost" onClick={() => set("author_photo_url", "")}>Remove</Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={content.author_name || ""} onChange={(e) => set("author_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea rows={4} value={content.author_bio || ""} onChange={(e) => set("author_bio", e.target.value)} />
            </div>
          </Section>

          <Section title="Testimonials" badge="AI placeholders">
            <p className="text-xs text-muted-foreground">Swap these for quotes from real readers before you promote the page.</p>
            {testimonials.map((t, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3">
                <Textarea rows={2} value={t.quote} onChange={(e) => updateList<Testimonial>("testimonials", testimonials, i, { quote: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Name" value={t.name} onChange={(e) => updateList<Testimonial>("testimonials", testimonials, i, { name: e.target.value })} />
                  <Input placeholder="Role" value={t.role} onChange={(e) => updateList<Testimonial>("testimonials", testimonials, i, { role: e.target.value })} />
                  <Button size="icon" variant="ghost" onClick={() => set("testimonials", testimonials.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => set("testimonials", [...testimonials, { name: "", role: "", quote: "" }])}><Plus /> Add testimonial</Button>
          </Section>

          <Section title="FAQ">
            {faq.map((f, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3">
                <div className="flex gap-2">
                  <Input placeholder="Question" value={f.question} onChange={(e) => updateList<FaqItem>("faq", faq, i, { question: e.target.value })} />
                  <Button size="icon" variant="ghost" onClick={() => set("faq", faq.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
                <Textarea rows={2} placeholder="Answer" value={f.answer} onChange={(e) => updateList<FaqItem>("faq", faq, i, { answer: e.target.value })} />
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => set("faq", [...faq, { question: "", answer: "" }])}><Plus /> Add question</Button>
          </Section>

          <Section title="Guarantee">
            <Textarea rows={2} value={content.guarantee || ""} onChange={(e) => set("guarantee", e.target.value)} />
          </Section>
        </aside>

        <div className="bg-neutral-100 lg:h-[calc(100vh-65px)] lg:overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-neutral-100/90 py-3 backdrop-blur">
            <div className="flex rounded-xl border bg-white p-1">
              {(["desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", device === d ? "bg-neutral-950 text-white" : "text-muted-foreground")}
                >
                  {d === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />} {d === "desktop" ? "Desktop" : "Mobile"}
                </button>
              ))}
            </div>
            <a href={`/p/${product.slug}`} target="_blank" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Open full page
            </a>
          </div>
          <div className="px-4 pb-10">
            <div
              className={cn(
                "relative mx-auto overflow-hidden bg-white shadow-xl ring-1 ring-black/5 transition-all duration-300",
                device === "mobile" ? "w-[390px] max-w-full rounded-[36px] border-[10px] border-neutral-900" : "w-full max-w-[1200px] rounded-2xl"
              )}
            >
              {busy === "ai" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-medium shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> AI is writing your sales page...
                  </div>
                </div>
              )}
              <SalesPage template={template} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateThumb({ id, color, dark }: { id: SalesTemplateId; color: string; dark: string }) {
  if (id === "bold")
    return (
      <div className="aspect-[4/3] rounded-md p-1.5" style={{ background: dark }}>
        <div className="flex gap-1">
          <div className="flex-1 space-y-0.5">
            <div className="h-1.5 w-full rounded-sm bg-white/80" />
            <div className="h-1.5 w-2/3 rounded-sm bg-white/80" />
            <div className="mt-1 h-2 w-1/2 rounded-sm" style={{ background: color }} />
          </div>
          <div className="h-6 w-4 rounded-sm" style={{ background: color }} />
        </div>
      </div>
    );
  if (id === "minimal")
    return (
      <div className="aspect-[4/3] rounded-md bg-[#FCFBF8] p-1.5 ring-1 ring-black/5">
        <div className="h-1 w-1/3 rounded-sm bg-neutral-400" />
        <div className="mt-1.5 h-1.5 w-3/4 rounded-sm bg-neutral-700" />
        <div className="mt-0.5 h-1 w-1/2 rounded-sm bg-neutral-300" />
        <div className="mt-1.5 h-2 w-1/3 rounded-full" style={{ background: color }} />
      </div>
    );
  return (
    <div className="aspect-[4/3] rounded-md bg-white p-1.5 text-center ring-1 ring-black/5">
      <div className="mx-auto h-1.5 w-3/4 rounded-sm bg-neutral-700" />
      <div className="mx-auto mt-1 h-4 w-3 rounded-sm" style={{ background: color }} />
      <div className="mx-auto mt-1 h-1.5 w-1/2 rounded-sm" style={{ background: color }} />
    </div>
  );
}
