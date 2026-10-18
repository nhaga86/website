import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatsChart } from "@/components/charts/stats-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import { SyncButtons, SubscriberFilters } from "./subscriber-tools";

export const metadata = { title: "Subscribers" };

const PER_PAGE = 50;

export default async function SubscribersPage({ searchParams }: { searchParams: { product?: string; q?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const supabase = createClient();
  const current = await getCurrentUser();

  let query = supabase
    .from("subscribers")
    .select("id, email, name, purchased_at, product_id, products(title)", { count: "exact" })
    .order("purchased_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (searchParams.product) query = query.eq("product_id", searchParams.product);
  if (searchParams.q) query = query.ilike("email", `%${searchParams.q.replace(/[%_]/g, "")}%`);

  const [{ data, count }, { data: products }, { data: stats }] = await Promise.all([
    query,
    supabase.from("products").select("id, title").order("title"),
    supabase.rpc("creator_daily_stats", { p_days: 30, p_product_id: searchParams.product || null }),
  ]);
  const rows = (data ?? []) as unknown as { id: string; email: string; name: string | null; purchased_at: string; products: { title: string } | null }[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const chart = ((stats as { day: string; subscribers: number }[] | null) ?? []).map((d) => ({ day: d.day, subscribers: Number(d.subscribers) }));
  const exportHref = `/api/subscribers/export${searchParams.product ? `?product=${searchParams.product}` : ""}`;
  const pageHref = (p: number) => {
    const q = new URLSearchParams({ ...(searchParams.product ? { product: searchParams.product } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), page: String(p) });
    return `/dashboard/subscribers?${q}`;
  };

  return (
    <div>
      <PageHeader title="Subscribers" description={`${formatNumber(total)} buyers on your list`}>
        <Button variant="outline" asChild>
          <a href={exportHref}><Download /> Export CSV</a>
        </Button>
      </PageHeader>
      <div className="space-y-6 px-6 py-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader><CardTitle className="text-base">New subscribers, last 30 days</CardTitle></CardHeader>
            <CardContent><StatsChart type="bar" data={chart} series={[{ key: "subscribers", label: "Subscribers", color: "#7C3AED" }]} height={200} /></CardContent>
          </Card>
          <SyncButtons
            convertkit={!!current?.profile.convertkit_api_key}
            mailerlite={!!current?.profile.mailerlite_api_key}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <SubscriberFilters products={products ?? []} product={searchParams.product} q={searchParams.q} />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Purchased</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No subscribers yet. They appear here after the first sale.</TableCell>
                  </TableRow>
                )}
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell>{s.name || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{s.products?.title}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(s.purchased_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {page > 1 && <Link href={pageHref(page - 1)} className="rounded-lg border px-3 py-1.5">Previous</Link>}
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            {page < pages && <Link href={pageHref(page + 1)} className="rounded-lg border px-3 py-1.5">Next</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
