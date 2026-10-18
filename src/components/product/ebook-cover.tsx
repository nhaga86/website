import { cn, readableOn } from "@/lib/utils";
import type { BrandColors } from "@/lib/types";

export interface EbookCoverProps {
  title: string;
  subtitle?: string | null;
  author?: string | null;
  coverUrl?: string | null;
  overlay?: boolean;
  colors: BrandColors;
  headingFont?: string;
  bodyFont?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** 2:3 ebook cover. AI artwork gets the title overlaid, uploaded covers show as-is. */
export function EbookCover({
  title,
  subtitle,
  author,
  coverUrl,
  overlay = true,
  colors,
  headingFont,
  bodyFont,
  className,
  size = "md",
}: EbookCoverProps) {
  const showText = !coverUrl || overlay;
  const textColor = coverUrl ? "#FFFFFF" : readableOn(colors.primary);
  const titleSize = size === "sm" ? "text-[13px]" : size === "lg" ? "text-3xl" : "text-xl";
  const subSize = size === "sm" ? "text-[8px]" : size === "lg" ? "text-sm" : "text-[11px]";

  return (
    <div
      className={cn("relative aspect-[2/3] overflow-hidden rounded-md shadow-2xl ring-1 ring-black/5", className)}
      style={{ background: `linear-gradient(160deg, ${colors.primary}, ${colors.secondary})` }}
    >
      {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {showText && (
        <>
          {coverUrl && <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/70 to-transparent" />}
          <div className={cn("relative flex h-full flex-col justify-between text-center", size === "sm" ? "p-2.5" : "p-6")} style={{ color: textColor }}>
            <div>
              <p className={cn("font-bold leading-tight", titleSize)} style={{ fontFamily: headingFont ? `'${headingFont}', serif` : undefined }}>
                {title}
              </p>
              {subtitle && (
                <p className={cn("mt-2 leading-snug opacity-90", subSize)} style={{ fontFamily: bodyFont ? `'${bodyFont}', sans-serif` : undefined }}>
                  {subtitle}
                </p>
              )}
            </div>
            {author && (
              <p className={cn("font-semibold uppercase tracking-[0.2em] opacity-90", subSize)} style={{ fontFamily: bodyFont ? `'${bodyFont}', sans-serif` : undefined }}>
                {author}
              </p>
            )}
          </div>
        </>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/25 to-transparent" />
    </div>
  );
}
