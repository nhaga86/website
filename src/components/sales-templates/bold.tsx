import { readableOn } from "@/lib/utils";
import { AuthorAvatar, Benefits, Cover, CtaButton, Faq, Paragraphs, Stars, fontVars } from "./shared";
import type { SalesPageData } from "./types";

export function BoldTemplate({ d }: { d: SalesPageData }) {
  const c = d.content;
  const dark = d.colors.secondary;
  const onDark = readableOn(dark);
  return (
    <div className="@container [font-family:var(--b-font)]" style={{ ...fontVars(d), background: dark, color: onDark }}>
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: d.colors.primary }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 @3xl:grid-cols-[1.2fr_1fr] @3xl:py-28">
          <div>
            {d.brandName && (
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]" style={{ background: d.colors.primary, color: readableOn(d.colors.primary) }}>
                {d.brandName}
              </span>
            )}
            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight [font-family:var(--h-font)] @3xl:text-7xl">
              {c.hero_headline || d.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg opacity-80">{c.hero_subheadline || d.subtitle}</p>
            <div className="mt-10 flex flex-col gap-3 @lg:flex-row @lg:items-center">
              <CtaButton d={d} />
              <span className="text-sm opacity-60">Instant download</span>
            </div>
          </div>
          <div className="mx-auto w-60 rotate-3 @3xl:w-80">
            <Cover d={d} />
          </div>
        </div>
      </section>

      {d.description && (
        <section className="border-y border-white/10">
          <div className="mx-auto max-w-3xl px-6 py-16 text-xl leading-relaxed opacity-90">
            <Paragraphs text={d.description} />
          </div>
        </section>
      )}

      {!!c.benefits?.length && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-4xl font-black uppercase [font-family:var(--h-font)]">Why this works</h2>
          <Benefits d={d} dark />
        </section>
      )}

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-4xl font-black uppercase [font-family:var(--h-font)]">{c.whats_inside_title || "Inside the book"}</h2>
        <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 @2xl:grid-cols-2">
          {d.chapters.map((ch, i) => (
            <div key={i} className="p-6" style={{ background: dark }}>
              <span className="text-5xl font-black [font-family:var(--h-font)]" style={{ color: d.colors.primary }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-lg font-bold">{ch.title}</p>
              {ch.summary && <p className="mt-1 text-sm opacity-60">{ch.summary}</p>}
            </div>
          ))}
        </div>
      </section>

      {!!c.testimonials?.length && (
        <section className="py-16" style={{ background: d.colors.primary, color: readableOn(d.colors.primary) }}>
          <div className="mx-auto grid max-w-6xl gap-6 px-6 @3xl:grid-cols-3">
            {c.testimonials.map((t, i) => (
              <figure key={i}>
                <Stars color={readableOn(d.colors.primary)} />
                <blockquote className="mt-4 text-xl font-semibold leading-snug">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm opacity-80">
                  {t.name}
                  {t.role && `, ${t.role}`}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(c.author_bio || c.author_name) && (
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-20 @2xl:grid-cols-[auto_1fr]">
          <AuthorAvatar d={d} className="mx-auto h-40 w-40" />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: d.colors.primary }}>Your guide</p>
            <h3 className="mt-2 text-3xl font-black uppercase [font-family:var(--h-font)]">{c.author_name}</h3>
            <p className="mt-4 text-lg leading-relaxed opacity-80">{c.author_bio}</p>
          </div>
        </section>
      )}

      {!!c.faq?.length && (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="mb-8 text-4xl font-black uppercase [font-family:var(--h-font)]">FAQ</h2>
          <Faq d={d} dark />
        </section>
      )}

      <section className="border-t border-white/10 px-6 py-20 text-center">
        <h2 className="mx-auto max-w-3xl text-4xl font-black uppercase [font-family:var(--h-font)] @3xl:text-5xl">Start today</h2>
        {c.guarantee && <p className="mx-auto mt-4 max-w-xl opacity-70">{c.guarantee}</p>}
        <div className="mt-10">
          <CtaButton d={d} />
        </div>
      </section>
    </div>
  );
}
