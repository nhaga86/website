import { readableOn } from "@/lib/utils";
import { AuthorAvatar, Benefits, Cover, CtaButton, Faq, Paragraphs, Stars, fontVars } from "./shared";
import type { SalesPageData } from "./types";

export function ClassicTemplate({ d }: { d: SalesPageData }) {
  const c = d.content;
  return (
    <div className="@container bg-white text-neutral-800 [font-family:var(--b-font)]" style={fontVars(d)}>
      <section style={{ background: d.colors.accent }}>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center @3xl:py-24">
          {d.brandName && <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: d.colors.primary }}>{d.brandName}</p>}
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight [font-family:var(--h-font)] @3xl:text-6xl" style={{ color: d.colors.secondary }}>
            {c.hero_headline || d.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg opacity-80 @3xl:text-xl">{c.hero_subheadline || d.subtitle}</p>
          <div className="mx-auto mt-12 w-56 @3xl:w-72">
            <Cover d={d} />
          </div>
          <div className="mt-12">
            <CtaButton d={d} />
            <p className="mt-3 text-sm opacity-60">Instant PDF download. Delivered to your inbox.</p>
          </div>
        </div>
      </section>

      {d.description && (
        <section className="mx-auto max-w-3xl px-6 py-16 text-lg leading-relaxed">
          <Paragraphs text={d.description} />
        </section>
      )}

      {!!c.benefits?.length && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <h2 className="mb-8 text-center text-3xl font-bold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>
            What you will walk away with
          </h2>
          <Benefits d={d} />
        </section>
      )}

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-10 text-center text-3xl font-bold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>
            {c.whats_inside_title || "What's inside"}
          </h2>
          <ol className="space-y-3">
            {d.chapters.map((ch, i) => (
              <li key={i} className="flex gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: d.colors.primary, color: readableOn(d.colors.primary) }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-semibold" style={{ color: d.colors.secondary }}>{ch.title}</p>
                  {ch.summary && <p className="mt-1 text-sm opacity-70">{ch.summary}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {!!c.testimonials?.length && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-3xl font-bold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>
            Readers are talking
          </h2>
          <div className="grid gap-5 @3xl:grid-cols-3">
            {c.testimonials.map((t, i) => (
              <figure key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <Stars color={d.colors.primary} />
                <blockquote className="mt-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  {t.role && <span className="opacity-60">, {t.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(c.author_bio || c.author_name) && (
        <section className="py-16" style={{ background: d.colors.accent }}>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center @2xl:flex-row @2xl:text-left">
            <AuthorAvatar d={d} className="h-32 w-32 shrink-0" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: d.colors.primary }}>About the author</p>
              <h3 className="mt-2 text-2xl font-bold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>{c.author_name}</h3>
              <p className="mt-3 leading-relaxed opacity-80">{c.author_bio}</p>
            </div>
          </div>
        </section>
      )}

      {!!c.faq?.length && (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold [font-family:var(--h-font)]" style={{ color: d.colors.secondary }}>
            Questions
          </h2>
          <Faq d={d} />
        </section>
      )}

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl px-8 py-14 text-center" style={{ background: d.colors.secondary, color: readableOn(d.colors.secondary) }}>
          <h2 className="text-3xl font-bold [font-family:var(--h-font)]">{d.title}</h2>
          {c.guarantee && <p className="mx-auto mt-3 max-w-xl opacity-80">{c.guarantee}</p>}
          <div className="mt-8">
            <CtaButton d={d} />
          </div>
        </div>
      </section>
    </div>
  );
}
