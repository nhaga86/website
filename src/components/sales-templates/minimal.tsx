import { AuthorAvatar, Cover, CtaButton, Faq, Paragraphs, fontVars } from "./shared";
import type { SalesPageData } from "./types";

export function MinimalTemplate({ d }: { d: SalesPageData }) {
  const c = d.content;
  return (
    <div className="@container bg-[#FCFBF8] text-neutral-800 [font-family:var(--b-font)]" style={fontVars(d)}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm">
        <span className="font-semibold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>{d.brandName || d.title}</span>
        <span className="opacity-60">{d.price}</span>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-12 @3xl:grid-cols-[1fr_auto] @3xl:py-20">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.1] [font-family:var(--h-font)] @3xl:text-6xl" style={{ color: d.colors.secondary }}>
            {c.hero_headline || d.title}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed opacity-70">{c.hero_subheadline || d.subtitle}</p>
          <div className="mt-10">
            <CtaButton d={d} className="rounded-full shadow-none" />
          </div>
        </div>
        <div className="mx-auto w-52 @3xl:w-64">
          <Cover d={d} />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-black/10" />
      </div>

      <section className="mx-auto max-w-2xl px-6 py-16 text-lg leading-[1.8]">
        <Paragraphs text={d.description} />
        {!!c.benefits?.length && (
          <ul className="mt-10 space-y-3">
            {c.benefits.map((b, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-[0.9em] h-px w-5 shrink-0" style={{ background: d.colors.primary }} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: d.colors.primary }}>{c.whats_inside_title || "Contents"}</p>
        <ol className="mt-6 divide-y divide-black/10 border-y border-black/10">
          {d.chapters.map((ch, i) => (
            <li key={i} className="flex items-baseline gap-6 py-4">
              <span className="w-6 text-sm opacity-40">{i + 1}</span>
              <div>
                <p className="text-lg [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>{ch.title}</p>
                {ch.summary && <p className="mt-1 text-sm opacity-60">{ch.summary}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {!!c.testimonials?.length && (
        <section className="mx-auto max-w-2xl space-y-12 px-6 py-16">
          {c.testimonials.map((t, i) => (
            <figure key={i} className="text-center">
              <blockquote className="text-2xl leading-snug [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm opacity-60">
                {t.name}
                {t.role && `, ${t.role}`}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {(c.author_bio || c.author_name) && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="flex items-start gap-6">
            <AuthorAvatar d={d} className="h-20 w-20 shrink-0" />
            <div>
              <p className="text-lg font-semibold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>{c.author_name}</p>
              <p className="mt-2 leading-relaxed opacity-70">{c.author_bio}</p>
            </div>
          </div>
        </section>
      )}

      {!!c.faq?.length && (
        <section className="mx-auto max-w-2xl px-6 py-12">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: d.colors.primary }}>Questions</p>
          <Faq d={d} />
        </section>
      )}

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-12 text-center">
        <p className="text-3xl [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>{d.title}</p>
        {c.guarantee && <p className="mx-auto mt-3 max-w-md text-sm opacity-60">{c.guarantee}</p>}
        <div className="mt-8">
          <CtaButton d={d} className="rounded-full shadow-none" />
        </div>
      </section>
    </div>
  );
}
