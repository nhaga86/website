import { getApiUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/utils";

/** CSV of every buyer, paged through so large lists export in full. */
export async function GET(request: Request) {
  const current = await getApiUser({ requirePaid: false });
  if (!current) return unauthorized();
  const productId = new URL(request.url).searchParams.get("product");
  const supabase = createClient();
  const rows: Record<string, string>[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from("subscribers")
      .select("email, name, purchased_at, products(title)")
      .order("purchased_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (productId) q = q.eq("product_id", productId);
    const { data } = await q;
    if (!data?.length) break;
    for (const s of data as unknown as { email: string; name: string | null; purchased_at: string; products: { title: string } | null }[]) {
      rows.push({ email: s.email, name: s.name || "", product: s.products?.title || "", purchased_at: s.purchased_at });
    }
    if (data.length < PAGE) break;
  }
  const csv = toCsv(rows.length ? rows : [{ email: "", name: "", product: "", purchased_at: "" }]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
