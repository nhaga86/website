import { BoldTemplate } from "./bold";
import { ClassicTemplate } from "./classic";
import { MinimalTemplate } from "./minimal";
import { getFontPairing } from "@/lib/fonts";
import { formatMoney } from "@/lib/utils";
import type { Chapter, Product, SalesTemplateId } from "@/lib/types";
import type { SalesPageData } from "./types";

export { TEMPLATES } from "./types";
export type { SalesPageData } from "./types";

export function SalesPage({ template, data }: { template: SalesTemplateId; data: SalesPageData }) {
  if (template === "bold") return <BoldTemplate d={data} />;
  if (template === "minimal") return <MinimalTemplate d={data} />;
  return <ClassicTemplate d={data} />;
}

export function toSalesPageData(
  product: Product,
  chapters: Pick<Chapter, "title" | "summary">[],
  checkoutHref?: string
): SalesPageData {
  const fonts = getFontPairing(product.font);
  return {
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    coverUrl: product.cover_url,
    coverOverlay: product.cover_overlay,
    colors: product.brand_colors,
    headingFont: fonts.heading,
    bodyFont: fonts.body,
    price: formatMoney(product.price_cents, product.currency),
    brandName: product.brand_name,
    chapters: chapters.map((c) => ({ title: c.title, summary: c.summary })),
    content: product.sales_page || {},
    checkoutHref,
  };
}
