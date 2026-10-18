import Link from "next/link";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { StatsChart } from "@/components/charts/stats-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const metadata = { title: "Analytics" };

type Day = { day: string; views: number; sales: number; revenue: number; subscribers: number };

export default async function AnalyticsPage({ searchParams }: { searchParams: { days?: string; product?: string } }) {
  const days = [7, 30, 90].includes(Number(searchParams.days)) ? Number(searchParams.days) : 30;
  const supabase = createClient();
  const [{ data: stats }, { data: products }] = await Promise.all([
    supabase.rpc("creator_daily_stats", { p_days: days, p_product_id: searchParams.product || null }),
    supabase.from("products").select("*").order("revenue_cents", { ascending: false }).returns<Product[]>(),
  ]);
  const series: Day[] = ((stats as Day[] | null) ?? []).map((d) => ({
    day: d.day,
    views: Number(d.views),
    sales: Number(d.sales),
    revenue: Number(d.revenue),
    subscribers: Number(d.subscribers),
  }));
  const sum = (k: keyof Omit<Day, "day">) => series.reduce((n, d) => n + d[k], 0);
  const views = sum("views");
  const sales = sum("sales");
  const filterProduct = products?.find((p) => p.id === searchParams.product);

  const link = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { days: String(days), product: searchParams.product, ...params };
    Object.entries(merged).forEach(([k, v]) => v && q.set(k, v));
    return `/dashboard/analytics?${q.toString()}`;
  };

  return (
    <div>
      <PageHeader title="Analytics" description={filterProduct ? `Showing ${filterProduct.title}` : "All products"}>
        <div className="flex rounded-xl border p-1 text-sm">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={link({ days: String(d) })} className={`rounded-lg px-3 py-1 ${d === days ? "bg-neutral-950 text-white" : "text-muted-foreground"}`}>
              {d}d
            </Link>
          ))}
        </div>
        {filterProduct && (
          <Link href={link({ product: "" })} className="text-sm text-muted-foreground underline">
            All products
          </Link>
        )}
      </PageHeader>

      <div className="space-y-6 px-6 py-8 lg:px-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Views" value={formatNumber(views)} />
          <StatCard label="Sales" value={formatNumber(sales)} />
          <StatCard label="Revenue" value={formatMoney(sum("revenue"))} />
          <StatCard label="New subscribers" value={formatNumber(sum("subscribers"))} />
          <StatCard label="Conversion" value={views ? `${((sales / views) * 100).toFixed(1)}%` : "0%"} hint="Sales / views" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
            <CardContent><StatsChart data={series} series={[{ key: "revenue", label: "Revenue", color: "#7C3AED", money: true }]} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Sales and subscribers</CardTitle></CardHeader>
            <CardContent>
              <StatsChart
                type="bar"
                data={series}
                series={[
                  { key: "sales", label: "Sales", color: "#7C3AED" },
                  { key: "subscribers", label: "Subscribers", color: "#C4B5FD" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Page views</CardTitle></CardHeader>
          <CardContent><StatsChart data={series} series={[{ key: "views", label: "Views", color: "#0EA5E9" }]} height={200} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By product (all time)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={link({ product: p.id })} className="font-medium hover:underline">{p.title}</Link>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(p.views)}</TableCell>
                    <TableCell className="text-right">{formatNumber(p.sales_count)}</TableCell>
                    <TableCell className="text-right">{p.views ? `${((p.sales_count / p.views) * 100).toFixed(1)}%` : "0%"}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(p.revenue_cents, p.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
