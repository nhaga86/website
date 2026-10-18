"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TONES, type Tone } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { idea: "A 30 day morning routine for women in early sobriety", audience: "Women in their first year of recovery", tone: "Spiritual" as Tone },
  { idea: "How to price freelance design work and stop undercharging", audience: "New freelance designers", tone: "Bold" as Tone },
  { idea: "Meal prep on a $50 weekly budget", audience: "Busy college students", tone: "Friendly" as Tone },
];

type ChapterState = { n: number; title: string; status: "waiting" | "writing" | "done" | "error" };

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift()!);
    })
  );
}

export function IdeaForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("Friendly");
  const [phase, setPhase] = useState<"form" | "planning" | "writing">("form");
  const [chapters, setChapters] = useState<ChapterState[]>([]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setPhase("planning");
    try {
      const res = await fetch("/api/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, audience, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const list: ChapterState[] = data.chapters.map((c: { chapter_number: number; title: string }) => ({
        n: c.chapter_number,
        title: c.title,
        status: "waiting",
      }));
      setChapters(list);
      setPhase("writing");

      const update = (n: number, status: ChapterState["status"]) =>
        setChapters((prev) => prev.map((c) => (c.n === n ? { ...c, status } : c)));

      await runPool(list, 4, async (c) => {
        update(c.n, "writing");
        const r = await fetch(`/api/products/${data.id}/chapters/${c.n}/generate`, { method: "POST" });
        update(c.n, r.ok ? "done" : "error");
      });

      router.push(`/dashboard/products/${data.id}/review`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
      setPhase("form");
    }
  }

  if (phase !== "form") {
    const done = chapters.filter((c) => c.status === "done" || c.status === "error").length;
    const pct = phase === "planning" ? 8 : 15 + Math.round((done / Math.max(chapters.length, 1)) * 85);
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="text-center">
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">AI is writing your product...</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {phase === "planning"
              ? "Picking titles, writing sales copy, building the outline and brand kit."
              : `Writing chapters. ${done} of ${chapters.length} finished.`}
          </p>
        </div>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-8 space-y-2">
          {phase === "planning" &&
            ["Title options", "Subtitle and sales copy", "8 chapter outline", "Brand names, colors and fonts", "Cover prompt"].map((t) => (
              <li key={t} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> {t}
              </li>
            ))}
          {chapters.map((c) => (
            <li key={c.n} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  c.status === "done" && "bg-emerald-100 text-emerald-700",
                  c.status === "writing" && "bg-brand-100 text-brand-700",
                  c.status === "waiting" && "bg-muted text-muted-foreground",
                  c.status === "error" && "bg-red-100 text-red-700"
                )}
              >
                {c.status === "done" ? <Check className="h-3.5 w-3.5" /> : c.status === "writing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : c.status === "error" ? <X className="h-3.5 w-3.5" /> : c.n}
              </span>
              <span className="truncate">{c.title}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted-foreground">Keep this tab open. This takes about a minute.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">What are you creating?</h1>
      <p className="mt-2 text-muted-foreground">Three answers. The AI handles everything else, and you can edit every word after.</p>

      <form onSubmit={generate} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="idea">What is your digital product about?</Label>
          <Textarea
            id="idea"
            required
            minLength={3}
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="A guided journal that helps women in recovery rebuild self trust"
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-[1fr_200px]">
          <div className="space-y-2">
            <Label htmlFor="audience">Target audience</Label>
            <Input id="audience" required value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Women 25 to 45 in their first year sober" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select id="tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
              {TONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Sparkles /> Generate Product <ArrowRight />
        </Button>
      </form>

      <div className="mt-12">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Try an example</p>
        <div className="mt-3 grid gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.idea}
              type="button"
              onClick={() => {
                setIdea(ex.idea);
                setAudience(ex.audience);
                setTone(ex.tone);
              }}
              className="rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors hover:border-brand-300 hover:bg-brand-50/50"
            >
              <span className="font-medium">{ex.idea}</span>
              <span className="text-muted-foreground"> for {ex.audience.toLowerCase()}, {ex.tone.toLowerCase()} tone</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
