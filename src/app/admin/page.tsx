import Link from "next/link";
import { StatCard } from "@/components/dashboard/page-header";
import { StatsChart } from "@/components/charts/stats-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatMoney, formatNumber } from "@/lib/utils";
import { PayoutButton, RefundButton, UserActions } from "./admin-actions";

export const dynamic = "force-dynamic";

const TABS = ["overview", "users", "payments", "sales"] as const;
type Tab = (typeof TABS)[number];

type Totals = {
  users: number;
  paying_users: number;
  products: number;
  published_products: number;
  plan_revenue: number;
  sales_count: number;
  sales_volume: number;
  platform_fees: number;
  pending_payouts: number;
};

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  const tab: Tab = TABS.includes(searchParams.tab as Tab) ? (searchParams.tab as Tab) : "overview";
  const db = createAdminClient();
  const { data: totalsRows } = await db.rpc("admin_totals");
  const t = ((totalsRows as Totals[] | null)?.[0] ?? {}) as Partial<Totals>;
  const n = (k: keyof Totals) => Number(t[k] ?? 0);

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap gap-1 rounded-xl border bg-white p-1 text-sm sm:w-fit">
        {TABS.map((x) => (
          <Link key={x} href={`/admin?tab=${x}`} className={cn("rounded-lg px-4 py-1.5 capitalize", x === tab ? "bg-neutral-950 text-white" : "text-muted-foreground hover:text-foreground")}>
            {x}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={formatNumber(n("users"))} hint={`${formatNumber(n("paying_users"))} paying`} />
        <StatCard label="Plan revenue" value={formatMoney(n("plan_revenue"))} hint="Monthly + lifetime" />
        <StatCard label="Products" value={formatNumber(n("products"))} hint={`${formatNumber(n("published_products"))} published`} />
        <StatCard label="Creator sales" value={formatMoney(n("sales_volume"))} hint={`${formatNumber(n("sales_count"))} orders, ${formatMoney(n("platform_fees"))} fees`} />
      </div>

      {tab === "overview" && <Overview pending={n("pending_payouts")} />}
      {tab === "users" && <Users q={searchParams.q} />}
      {tab === "payments" && <Payments />}
      {tab === "sales" && <Sales />}
    </div>
  );
}

async function Overview({ pending }: { pending: number }) {
  const db = createAdminClient();
  const { data } = await db.rpc("admin_daily_revenue", { p_days: 30 });
  const rows = ((data as { day: string; plan_revenue: number; platform_fees: number; signups: number }[] | null) ?? []).map((d) => ({
    day: d.day,
    plan_revenue: Number(d.plan_revenue),
    platform_fees: Number(d.platform_fees),
    signups: Number(d.signups),
  }));
  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">Platform revenue, last 30 days</CardTitle></CardHeader>
        <CardContent>
          <StatsChart
            data={rows}
            series={[
              { key: "plan_revenue", label: "Plans", color: "#7C3AED", money: true },
              { key: "platform_fees", label: "Sale fees", color: "#22C55E", money: true },
            ]}
          />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Signups</CardTitle></CardHeader>
          <CardContent><StatsChart type="bar" data={rows} series={[{ key: "signups", label: "Signups", color: "#0EA5E9" }]} height={160} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Owed to creators</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatMoney(pending)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Platform collected sales not yet paid out.</p>
            <Link href="/admin?tab=sales" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">Review sales</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function Users({ q }: { q?: string }) {
  const db = createAdminClient();
  let query = db.from("users").select("*, products(count)").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.ilike("email", `%${q.replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const users = (data ?? []) as unknown as {
    id: string;
    email: string;
    full_name: string | null;
    plan: string;
    plan_status: string;
    banned: boolean;
    is_admin: boolean;
    stripe_connect_ready: boolean;
    created_at: string;
    products: { count: number }[];
  }[];
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Users</CardTitle>
        <form className="flex gap-2">
          <input type="hidden" name="tab" value="users" />
          <input name="q" defaultValue={q} placeholder="Search email" className="h-9 rounded-lg border px-3 text-sm" />
        </form>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Stripe</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={u.banned ? "bg-red-50/50" : undefined}>
                <TableCell>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.full_name}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={u.plan === "free" ? "secondary" : "default"}>{u.plan}</Badge>
                    {u.plan === "monthly" && <Badge variant="outline">{u.plan_status}</Badge>}
                    {u.banned && <Badge variant="destructive">banned</Badge>}
                    {u.is_admin && <Badge variant="outline">admin</Badge>}
                  </div>
                </TableCell>
                <TableCell>{u.products?.[0]?.count ?? 0}</TableCell>
                <TableCell>{u.stripe_connect_ready ? <Badge variant="success">Connect</Badge> : <span className="text-xs text-muted-foreground">Platform</span>}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <UserActions userId={u.id} banned={u.banned} isAdmin={u.is_admin} plan={u.plan} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function Payments() {
  const db = createAdminClient();
  const { data } = await db.from("payments").select("*, users(email)").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown as { id: string; kind: string; amount: number; currency: string; status: string; created_at: string; users: { email: string } | null }[];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Plan payments</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No payments yet</TableCell></TableRow>}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.users?.email ?? "Deleted user"}</TableCell>
                <TableCell className="capitalize">{p.kind}</TableCell>
                <TableCell>{formatMoney(p.amount, p.currency)}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(p.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {p.status === "refunded" ? <Badge variant="destructive">Refunded</Badge> : <RefundButton type="payment" id={p.id} label={formatMoney(p.amount, p.currency)} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function Sales() {
  const db = createAdminClient();
  const { data } = await db
    .from("sales")
    .select("*, products(title, users(email))")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as {
    id: string;
    buyer_email: string;
    amount: number;
    platform_fee: number;
    currency: string;
    status: string;
    payout_mode: string;
    payout_status: string;
    created_at: string;
    products: { title: string; users: { email: string } | null } | null;
  }[];
  const pendingIds = rows.filter((r) => r.status === "paid" && r.payout_mode === "platform" && r.payout_status === "pending").map((r) => r.id);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Product sales</CardTitle>
        {pendingIds.length > 0 && <PayoutButton saleIds={pendingIds} label={`Mark ${pendingIds.length} pending as paid out`} />}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No sales yet</TableCell></TableRow>}
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <p className="max-w-[220px] truncate font-medium">{s.products?.title}</p>
                  <p className="text-xs text-muted-foreground">{s.products?.users?.email}</p>
                </TableCell>
                <TableCell>{s.buyer_email}</TableCell>
                <TableCell>{formatMoney(s.amount, s.currency)}</TableCell>
                <TableCell className="text-muted-foreground">{formatMoney(s.platform_fee, s.currency)}</TableCell>
                <TableCell>
                  {s.payout_mode === "connect" ? (
                    <Badge variant="success">Connect</Badge>
                  ) : s.payout_status === "paid" ? (
                    <Badge variant="secondary">Paid out</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Owed {formatMoney(s.amount - s.platform_fee, s.currency)}</Badge>
                      {s.status === "paid" && <PayoutButton saleIds={[s.id]} label="Paid" small />}
                    </div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(s.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {s.status === "refunded" ? <Badge variant="destructive">Refunded</Badge> : <RefundButton type="sale" id={s.id} label={formatMoney(s.amount, s.currency)} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
