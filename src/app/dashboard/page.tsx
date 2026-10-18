import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { ProductCard } from "@/components/dashboard/product-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const metadata = { title: "My products" };

export default async function DashboardHome({ searchParams }: { searchParams: { welcome?: string } }) {
  const supabase = createClient();
  const [{ data: products }, { count: subscriberCount }] = await Promise.all([
    supabase.from("products").select("*").order("updated_at", { ascending: false }).returns<Product[]>(),
    supabase.from("subscribers").select("id", { count: "exact", head: true }),
  ]);
  const list = products ?? [];
  const totals = list.reduce(
    (acc, p) => ({ views: acc.views + p.views, sales: acc.sales + p.sales_count, revenue: acc.revenue + p.revenue_cents }),
    { views: 0, sales: 0, revenue: 0 }
  );

  return (
    <div>
      <PageHeader title="My products" description="Everything you've built, with live numbers.">
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus /> New product
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-8 px-6 py-8 lg:px-10">
        {searchParams.welcome && (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            <Sparkles className="h-4 w-4" /> Payment confirmed. Your account is active. Build your first product below.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Products" value={formatNumber(list.length)} hint={`${list.filter((p) => p.status === "published").length} live`} />
          <StatCard label="Page views" value={formatNumber(totals.views)} />
          <StatCard label="Sales" value={formatNumber(totals.sales)} hint={`${formatNumber(subscriberCount ?? 0)} subscribers`} />
          <StatCard label="Revenue" value={formatMoney(totals.revenue)} hint="Before platform fee" />
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed bg-neutral-50/50 px-6 py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">No products yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Describe an idea in one sentence. The AI writes the ebook, the copy and the sales page.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/new">
                <Plus /> Create your first product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
