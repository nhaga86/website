import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EbookCover } from "@/components/product/ebook-cover";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Storefront shown at the root of a creator's custom domain. */
export default async function Storefront() {
  const domain = headers().get("x-custom-domain");
  if (!domain) redirect("/");
  const db = createAdminClient();
  const { data: owner } = await db.from("users").select("id, full_name, banned").eq("custom_domain", domain).maybeSingle();
  if (!owner || owner.banned) redirect("/");
  const { data: products } = await db
    .from("products")
    .select("*")
    .eq("user_id", owner.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .returns<Product[]>();

  if (products?.length === 1) redirect(`/${products[0].slug}`);

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="container max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight">{owner.full_name || domain}</h1>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => (
            <Link key={p.id} href={`/${p.slug}`} className="rounded-2xl border bg-white p-5 transition-shadow hover:shadow-lg">
              <EbookCover title={p.title} subtitle={p.subtitle} coverUrl={p.cover_url} overlay={p.cover_overlay} colors={p.brand_colors} className="mx-auto w-40" />
              <p className="mt-4 font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">{formatMoney(p.price_cents, p.currency)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
