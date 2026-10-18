import "server-only";
import { jsPDF } from "jspdf";
import { htmlToBlocks } from "@/lib/html";
import { getFontPairing } from "@/lib/fonts";
import { readableOn } from "@/lib/utils";
import type { Chapter, Product } from "@/lib/types";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 64;
const CONTENT_W = PAGE_W - MARGIN * 2;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Built-in PDF fonts only cover Latin-1, so normalize typography first. */
function clean(text: string) {
  return text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

async function loadImage(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
    if (!isPng && !isJpg) return null;
    const format = isPng ? "PNG" : "JPEG";
    return { dataUrl: `data:image/${format.toLowerCase()};base64,${buf.toString("base64")}`, format };
  } catch {
    return null;
  }
}

export async function buildEbookPdf(product: Product, chapters: Chapter[], authorName?: string | null) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const fonts = getFontPairing(product.font);
  const colors = product.brand_colors;
  const primary = hexToRgb(colors.primary);
  const secondary = hexToRgb(colors.secondary);
  const sorted = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const byline = authorName || product.brand_name || "";

  doc.setProperties({ title: clean(product.title), subject: clean(product.subtitle || ""), author: clean(byline) });

  // ---- Cover ---------------------------------------------------------------
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  const cover = product.cover_url ? await loadImage(product.cover_url) : null;
  if (cover) {
    const props = doc.getImageProperties(cover.dataUrl);
    const scale = Math.max(PAGE_W / props.width, PAGE_H / props.height);
    const w = props.width * scale;
    const h = props.height * scale;
    doc.addImage(cover.dataUrl, cover.format, (PAGE_W - w) / 2, (PAGE_H - h) / 2, w, h);
  }
  if (!cover || product.cover_overlay) {
    const textColor = cover ? "#FFFFFF" : readableOn(colors.primary);
    if (cover) {
      const GState = (doc as unknown as { GState: new (o: { opacity: number }) => unknown }).GState;
      doc.setGState(new GState({ opacity: 0.55 }) as never);
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, PAGE_W, PAGE_H * 0.42, "F");
      doc.setGState(new GState({ opacity: 1 }) as never);
    }
    doc.setTextColor(...hexToRgb(textColor));
    doc.setFont(fonts.pdfHeading, "bold");
    doc.setFontSize(40);
    const titleLines = doc.splitTextToSize(clean(product.title), CONTENT_W);
    let y = 140;
    doc.text(titleLines, PAGE_W / 2, y, { align: "center", lineHeightFactor: 1.15 });
    y += titleLines.length * 46 + 10;
    if (product.subtitle) {
      doc.setFont(fonts.pdfBody, "normal");
      doc.setFontSize(16);
      const sub = doc.splitTextToSize(clean(product.subtitle), CONTENT_W - 40);
      doc.text(sub, PAGE_W / 2, y, { align: "center", lineHeightFactor: 1.35 });
    }
    if (byline) {
      doc.setFont(fonts.pdfBody, "bold");
      doc.setFontSize(13);
      doc.text(clean(byline).toUpperCase(), PAGE_W / 2, PAGE_H - 64, { align: "center", charSpace: 2 });
    }
  }

  // ---- Title page ------------------------------------------------------------
  doc.addPage();
  doc.setTextColor(...secondary);
  doc.setFont(fonts.pdfHeading, "bold");
  doc.setFontSize(30);
  const tLines = doc.splitTextToSize(clean(product.title), CONTENT_W);
  doc.text(tLines, PAGE_W / 2, PAGE_H / 2 - 60, { align: "center" });
  if (product.subtitle) {
    doc.setFont(fonts.pdfBody, "normal");
    doc.setFontSize(14);
    doc.setTextColor(90, 90, 90);
    doc.text(doc.splitTextToSize(clean(product.subtitle), CONTENT_W - 60), PAGE_W / 2, PAGE_H / 2 - 60 + tLines.length * 36 + 8, {
      align: "center",
    });
  }
  doc.setDrawColor(...primary);
  doc.setLineWidth(2);
  doc.line(PAGE_W / 2 - 30, PAGE_H / 2 + 60, PAGE_W / 2 + 30, PAGE_H / 2 + 60);
  if (byline) {
    doc.setFont(fonts.pdfBody, "normal");
    doc.setFontSize(12);
    doc.setTextColor(...secondary);
    doc.text(clean(byline), PAGE_W / 2, PAGE_H / 2 + 90, { align: "center" });
  }

  // ---- Table of contents -----------------------------------------------------
  doc.addPage();
  doc.setFont(fonts.pdfHeading, "bold");
  doc.setFontSize(26);
  doc.setTextColor(...secondary);
  doc.text("Contents", MARGIN, MARGIN + 30);
  let ty = MARGIN + 80;
  sorted.forEach((ch) => {
    doc.setFont(fonts.pdfBody, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(String(ch.chapter_number).padStart(2, "0"), MARGIN, ty);
    doc.setFont(fonts.pdfBody, "normal");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(clean(ch.title), CONTENT_W - 40);
    doc.text(lines, MARGIN + 36, ty);
    ty += lines.length * 18 + 16;
  });

  // ---- Chapters --------------------------------------------------------------
  const bodySize = 11.5;
  const lineH = bodySize * 1.55;
  let y = 0;
  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  for (const ch of sorted) {
    doc.addPage();
    y = MARGIN + 40;
    doc.setFont(fonts.pdfBody, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(`CHAPTER ${ch.chapter_number}`, MARGIN, y, { charSpace: 2 });
    y += 30;
    doc.setFont(fonts.pdfHeading, "bold");
    doc.setFontSize(26);
    doc.setTextColor(...secondary);
    const head = doc.splitTextToSize(clean(ch.title), CONTENT_W);
    doc.text(head, MARGIN, y, { lineHeightFactor: 1.2 });
    y += head.length * 31 + 6;
    doc.setDrawColor(...primary);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN + 40, y);
    y += 30;

    for (const block of htmlToBlocks(ch.content || "")) {
      const text = clean(block.text);
      if (block.type === "h2" || block.type === "h3") {
        const size = block.type === "h2" ? 17 : 14;
        doc.setFont(fonts.pdfHeading, "bold");
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, CONTENT_W);
        ensure(lines.length * size * 1.3 + lineH * 2);
        y += 8;
        doc.setTextColor(...(block.type === "h2" ? secondary : primary));
        doc.text(lines, MARGIN, y);
        y += lines.length * size * 1.3 + 6;
      } else if (block.type === "li") {
        doc.setFont(fonts.pdfBody, "normal");
        doc.setFontSize(bodySize);
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(text, CONTENT_W - 22);
        ensure(lines.length * lineH);
        doc.setTextColor(...primary);
        doc.text(block.ordered ? `${block.index}.` : "-", MARGIN + 4, y);
        doc.setTextColor(40, 40, 40);
        doc.text(lines, MARGIN + 22, y, { lineHeightFactor: 1.55 });
        y += lines.length * lineH + 4;
      } else if (block.type === "quote") {
        doc.setFont(fonts.pdfBody, "italic");
        doc.setFontSize(bodySize + 1);
        const lines = doc.splitTextToSize(text, CONTENT_W - 28);
        ensure(lines.length * lineH + 12);
        doc.setFillColor(...primary);
        doc.rect(MARGIN, y - bodySize, 3, lines.length * lineH, "F");
        doc.setTextColor(60, 60, 60);
        doc.text(lines, MARGIN + 18, y, { lineHeightFactor: 1.55 });
        y += lines.length * lineH + 12;
      } else {
        doc.setFont(fonts.pdfBody, "normal");
        doc.setFontSize(bodySize);
        doc.setTextColor(40, 40, 40);
        const lines: string[] = doc.splitTextToSize(text, CONTENT_W);
        // Allow paragraphs to break across pages line by line
        for (const line of lines) {
          ensure(lineH);
          doc.text(line, MARGIN, y);
          y += lineH;
        }
        y += 8;
      }
    }
  }

  // ---- Footers ---------------------------------------------------------------
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setFont(fonts.pdfBody, "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(String(i - 1), PAGE_W - MARGIN, PAGE_H - 30, { align: "right" });
    if (i > 3) doc.text(clean(product.title).slice(0, 80), MARGIN, PAGE_H - 30);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
