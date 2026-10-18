"use client";

import { forwardRef } from "react";
import { EbookCover } from "@/components/product/ebook-cover";
import { getFontPairing } from "@/lib/fonts";
import { sanitizeHtml } from "@/lib/html";
import { cn } from "@/lib/utils";
import type { BrandColors } from "@/lib/types";

export interface PreviewChapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
}

interface Props {
  title: string;
  subtitle: string;
  author: string;
  coverUrl: string | null;
  coverOverlay: boolean;
  colors: BrandColors;
  fontId: string;
  chapters: PreviewChapter[];
  activeChapterId: string | null;
}

/** Live, page-by-page preview of the ebook. Mirrors the PDF layout. */
export const EbookPreview = forwardRef<HTMLDivElement, Props>(function EbookPreview(
  { title, subtitle, author, coverUrl, coverOverlay, colors, fontId, chapters, activeChapterId },
  ref
) {
  const fonts = getFontPairing(fontId);
  const heading = { fontFamily: `'${fonts.heading}', Georgia, serif`, color: colors.secondary };
  const body = { fontFamily: `'${fonts.body}', system-ui, sans-serif` };

  return (
    <div ref={ref} className="space-y-8">
      <div className="mx-auto w-full max-w-[420px]">
        <EbookCover
          title={title}
          subtitle={subtitle}
          author={author}
          coverUrl={coverUrl}
          overlay={coverOverlay}
          colors={colors}
          headingFont={fonts.heading}
          bodyFont={fonts.body}
          size="lg"
        />
      </div>

      <Page>
        <h2 className="text-3xl font-bold" style={heading}>Contents</h2>
        <ol className="mt-8 space-y-3" style={body}>
          {chapters.map((c) => (
            <li key={c.id} className="flex gap-4">
              <span className="w-6 text-sm font-semibold" style={{ color: colors.primary }}>{String(c.chapter_number).padStart(2, "0")}</span>
              <span>{c.title}</span>
            </li>
          ))}
        </ol>
      </Page>

      {chapters.map((c) => (
        <Page key={c.id} id={`preview-chapter-${c.id}`} active={c.id === activeChapterId} accent={colors.primary}>
          <p className="text-xs font-semibold tracking-[0.2em]" style={{ ...body, color: colors.primary }}>CHAPTER {c.chapter_number}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight" style={heading}>{c.title}</h2>
          <div className="my-6 h-0.5 w-10" style={{ background: colors.primary }} />
          {c.content.trim() ? (
            <div
              className="prose prose-neutral max-w-none prose-headings:font-bold prose-p:leading-relaxed"
              style={{ ...body, ["--tw-prose-headings" as string]: colors.secondary, ["--tw-prose-bullets" as string]: colors.primary, ["--tw-prose-quote-borders" as string]: colors.primary }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
            />
          ) : (
            <p className="text-sm italic text-muted-foreground">This chapter is empty. Write it or let the AI draft it.</p>
          )}
        </Page>
      ))}
    </div>
  );
});

function Page({ children, id, active, accent }: { children: React.ReactNode; id?: string; active?: boolean; accent?: string }) {
  return (
    <div
      id={id}
      className={cn("mx-auto w-full max-w-[640px] scroll-mt-24 rounded-sm bg-white px-8 py-12 shadow-lg ring-1 ring-black/5 transition-shadow sm:px-14", active && "ring-2")}
      style={active ? ({ ["--tw-ring-color" as string]: accent } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
