import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SalesPage, toSalesPageData } from "@/components/sales-templates";
import { FontLoader } from "@/components/product/font-loader";
import { getPublicProduct } from "@/lib/public";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPublicProduct(params.slug);
  if (!data) return { title: "Not found" };
  const { product } = data;
  return {
    title: product.sales_page?.hero_headline || product.title,
    description: product.subtitle || product.description?.slice(0, 160) || undefined,
    openGraph: { title: product.title, description: product.subtitle || undefined, images: product.cover_url ? [product.cover_url] : [] },
  };
}

export default async function PublicProductPage({ params }: { params: { slug: string } }) {
  const data = await getPublicProduct(params.slug);
  if (!data) notFound();
  const { product, chapters } = data;

  const {
    data: { user },
  } = await createClient().auth.getUser();
  const isOwner = user?.id === product.user_id;

  if (product.status !== "published" && !isOwner) notFound();
  if (!isOwner) await createAdminClient().rpc("increment_product_views", { p_product_id: product.id });

  const checkoutHref = product.status === "published" ? `/api/checkout/${product.slug}` : undefined;

  return (
    <>
      <FontLoader fontId={product.font} />
      {isOwner && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-neutral-950 px-4 py-2 text-xs text-white">
          {product.status === "published" ? "You are viewing your live page." : "Preview. This page is not published yet."}
          <Link href={`/dashboard/products/${product.id}/sales-page`} className="font-semibold underline">
            Edit page
          </Link>
        </div>
      )}
      <SalesPage template={product.sales_page_template} data={toSalesPageData(product, chapters, checkoutHref)} />
      <footer className="bg-white py-6 text-center text-xs text-neutral-400">
        Secure checkout by Stripe. Built with {APP_NAME}.
      </footer>
    </>
  );
}
