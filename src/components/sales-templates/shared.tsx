import { Check, ChevronDown, Star } from "lucide-react";
import { EbookCover } from "@/components/product/ebook-cover";
import { cn, readableOn } from "@/lib/utils";
import type { SalesPageData } from "./types";

export function fontVars(d: SalesPageData) {
  return {
    "--h-font": `'${d.headingFont}', Georgia, serif`,
    "--b-font": `'${d.bodyFont}', system-ui, sans-serif`,
  } as React.CSSProperties;
}

export function Cover({ d, className, size = "lg" }: { d: SalesPageData; className?: string; size?: "md" | "lg" }) {
  return (
    <EbookCover
      title={d.title}
      subtitle={d.subtitle}
      author={d.content.author_name || d.brandName}
      coverUrl={d.coverUrl}
      overlay={d.coverOverlay}
      colors={d.colors}
      headingFont={d.headingFont}
      bodyFont={d.bodyFont}
      size={size}
      className={className}
    />
  );
}

export function CtaButton({ d, className, color }: { d: SalesPageData; className?: string; color?: string }) {
  const bg = color || d.colors.primary;
  const label = `${d.content.cta_text || "Get instant access"} | ${d.price}`;
  const classes = cn(
    "inline-flex items-center justify-center rounded-xl px-7 py-4 text-base font-semibold shadow-lg transition-transform hover:-translate-y-0.5",
    className
  );
  const style = { background: bg, color: readableOn(bg) };
  if (!d.checkoutHref) {
    return (
      <span className={classes} style={style}>
        {label}
      </span>
    );
  }
  return (
    <a href={d.checkoutHref} rel="nofollow" className={classes} style={style}>
      {label}
    </a>
  );
}

export function Paragraphs({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn("space-y-4", className)}>
      {text
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

export function Benefits({ d, dark }: { d: SalesPageData; dark?: boolean }) {
  if (!d.content.benefits?.length) return null;
  return (
    <ul className="grid gap-3 @2xl:grid-cols-2">
      {d.content.benefits.map((b, i) => (
        <li key={i} className={cn("flex items-start gap-3 rounded-xl p-4", dark ? "bg-white/5" : "bg-white shadow-sm ring-1 ring-black/5")}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: d.colors.primary, color: readableOn(d.colors.primary) }}>
            <Check className="h-3.5 w-3.5" />
          </span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

export function Stars({ color }: { color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4" style={{ fill: color, color }} />
      ))}
    </div>
  );
}

export function Faq({ d, dark }: { d: SalesPageData; dark?: boolean }) {
  if (!d.content.faq?.length) return null;
  return (
    <div className={cn("divide-y rounded-2xl", dark ? "divide-white/10 bg-white/5" : "divide-black/5 bg-white shadow-sm ring-1 ring-black/5")}>
      {d.content.faq.map((f, i) => (
        <details key={i} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {f.question}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 opacity-80">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function AuthorAvatar({ d, className }: { d: SalesPageData; className?: string }) {
  const name = d.content.author_name || d.brandName || "Author";
  if (d.content.author_photo_url) {
    return <img src={d.content.author_photo_url} alt={name} className={cn("rounded-full object-cover", className)} />;
  }
  return (
    <div
      className={cn("flex items-center justify-center rounded-full text-2xl font-bold", className)}
      style={{ background: d.colors.primary, color: readableOn(d.colors.primary) }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
