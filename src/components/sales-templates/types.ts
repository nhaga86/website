import type { BrandColors, SalesPageContent, SalesTemplateId } from "@/lib/types";

export interface SalesPageData {
  title: string;
  subtitle: string | null;
  description: string | null;
  coverUrl: string | null;
  coverOverlay: boolean;
  colors: BrandColors;
  headingFont: string;
  bodyFont: string;
  price: string;
  brandName: string | null;
  chapters: { title: string; summary: string | null }[];
  content: SalesPageContent;
  /** Link to checkout. Leave empty in previews. */
  checkoutHref?: string;
}

export interface TemplateMeta {
  id: SalesTemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "classic", name: "Classic", description: "Centered hero with the cover up front. Long form, proven layout." },
  { id: "bold", name: "Bold", description: "Dark split hero, big type, strong contrast. For confident offers." },
  { id: "minimal", name: "Minimal", description: "Editorial and airy. Made for reflective, personal topics." },
];
