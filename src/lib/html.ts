/** Minimal helpers for the HTML that the AI and the rich text editor produce. */

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&hellip;": "...",
};

export function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m] ?? m);
}

export function stripTags(html: string) {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t]+/g, " ").trim();
}

export type Block =
  | { type: "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "li"; text: string; ordered: boolean; index: number };

/** Flattens editor HTML into simple blocks for PDF rendering. */
export function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const src = html.replace(/\r/g, "");
  const re = /<(h1|h2|h3|h4|p|blockquote|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  let matchedAny = false;
  while ((m = re.exec(src))) {
    matchedAny = true;
    const tag = m[1].toLowerCase();
    const inner = m[2];
    if (tag === "ul" || tag === "ol") {
      const items = inner.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi) || [];
      items.forEach((li, i) => {
        const text = stripTags(li);
        if (text) blocks.push({ type: "li", text, ordered: tag === "ol", index: i + 1 });
      });
    } else {
      const text = stripTags(inner);
      if (!text) continue;
      if (tag === "h1" || tag === "h2") blocks.push({ type: "h2", text });
      else if (tag === "h3" || tag === "h4") blocks.push({ type: "h3", text });
      else if (tag === "blockquote") blocks.push({ type: "quote", text });
      else blocks.push({ type: "p", text });
    }
  }
  if (!matchedAny) {
    stripTags(src)
      .split(/\n{2,}/)
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((text) => blocks.push({ type: "p", text }));
  }
  return blocks;
}

/** Removes scripts, event handlers and javascript: URLs before rendering editor HTML. */
export function sanitizeHtml(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

export function wordCount(html: string) {
  const text = stripTags(html);
  return text ? text.split(/\s+/).length : 0;
}
